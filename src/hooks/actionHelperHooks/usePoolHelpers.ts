import { useContext, useEffect, useState } from 'react';
import { ethers, BigNumber } from 'ethers';
import { UserContext } from '../../contexts/UserContext';
import { IAsset, ISeries, IStrategy, IVault } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import {
  fyTokenForMint,
  splitLiquidity,
  getPoolPercent,
  maxFyTokenOut,
  strategyTokenValue,
} from '../../utils/yieldMath';
import { ZERO_BN } from '../../utils/constants';

export const usePoolHelpers = (input: string | undefined) => {
  /* STATE FROM CONTEXT */
  const {
    userState: {
      selectedSeries,
      selectedBaseId,
      selectedStrategyAddr,
      strategyMap,
      seriesMap,
      vaultMap,
      assetMap,
      activeAccount,
    },
  } = useContext(UserContext);

  const strategy: IStrategy | undefined = strategyMap?.get(selectedStrategyAddr);
  const strategySeries: ISeries | undefined = seriesMap?.get(
    selectedStrategyAddr ? strategy?.currentSeriesId : selectedSeries
  );
  const strategyBase: IAsset | undefined = assetMap?.get(selectedStrategyAddr ? strategy?.baseId : selectedBaseId);

  /* LOCAL STATE */
  const [_input, setInput] = useState<BigNumber>(ethers.constants.Zero);
  const [poolPercentPreview, setPoolPercentPreview] = useState<string | undefined>();

  const [maxPool, setMaxPool] = useState<string | undefined>();
  const [canBuyAndPool, setCanBuyAndPool] = useState<boolean | undefined>(false);

  /* remove liquidity helpers */
  const [matchingVault, setMatchingVault] = useState<IVault | undefined>();
  const [maxRemoveNoVault, setMaxRemoveNoVault] = useState<string | undefined>();
  const [maxRemoveWithVault, setMaxRemoveWithVault] = useState<string | undefined>();

  const [healthyBaseReserves, setHealthyBaseReserves] = useState<boolean>();
  const [fyTokenTradePossible, setFyTokenTradePossible] = useState<boolean>();

  const [inputTradeValue, setInputTradeValue] = useState<BigNumber | undefined>();
  const [inputTradeValue_, setInputTradeValue_] = useState<string | undefined>();
  const [accountTradeValue, setAccountTradeValue] = useState<string | undefined>();

  /* set input (need to make sure we can parse the input value) */
  useEffect(() => {
    if (input) {
      try {
        // const _inputWithSlippage = calculateSlippage(_input, slippageTolerance );
        const cleanedInput = cleanValue(input, strategy?.decimals);
        const parsedInput = ethers.utils.parseUnits(cleanedInput, strategyBase?.decimals);
        setInput(parsedInput);
      } catch (e) {
        console.log(e);
      }
    } else {
      setInput(ethers.constants.Zero);
    }
  }, [input, strategy?.decimals, strategyBase]);

  /* Check if base reserves are too low for max trade  */
  useEffect(() => {
    if (strategy && strategySeries) {
      const tradeable = strategyTokenValue(
        strategy.accountBalance!,
        strategy.strategyTotalSupply!,
        strategySeries.baseReserves,
        strategySeries.fyTokenReserves,
        strategy.poolTotalSupply!,
        strategySeries.getTimeTillMaturity(),
        strategySeries.decimals
      )[0].gt(ethers.constants.Zero);

      setHealthyBaseReserves(tradeable);
      setMaxRemoveNoVault(ethers.utils.formatUnits(strategy?.accountBalance!, strategySeries.decimals));
    }
  }, [strategy, strategySeries]);

  /* Set the trade value and check if base reserves are too low for specific input  */
  useEffect(() => {
    if (strategy && strategySeries) {
      const [_sellValue, _totalValue] = strategyTokenValue(
        _input,
        strategy.strategyTotalSupply!,
        strategySeries.baseReserves,
        strategySeries.fyTokenReserves,
        strategy.poolTotalSupply!,
        strategySeries.getTimeTillMaturity(),
        strategySeries.decimals
      );
      const tradeable = _sellValue.gt(ethers.constants.Zero);

      console.log('Is tradeable:', tradeable);
      setFyTokenTradePossible(tradeable);
      setInputTradeValue(_sellValue);
      setInputTradeValue_(ethers.utils.formatUnits(_sellValue, strategySeries.decimals));
    }
  }, [_input, strategySeries, strategy]);

  /* check account token trade value */
  useEffect(() => {
    if (strategySeries && strategy?.accountBalance?.gt(ZERO_BN)) {
      const [_sellValue, _totalValue] = strategyTokenValue(
        strategy?.accountBalance,
        strategy.strategyTotalSupply!,
        strategySeries.baseReserves,
        strategySeries.fyTokenReserves,
        strategy.poolTotalSupply!,
        strategySeries.getTimeTillMaturity(),
        strategySeries.decimals
      );
      const tradeable = _sellValue.gt(ethers.constants.Zero);
      tradeable && setAccountTradeValue(ethers.utils.formatUnits(_sellValue, strategy.decimals));
    }
  }, [
    strategy?.accountBalance,
    strategy?.decimals,
    strategySeries,
    strategy?.strategyTotalSupply,
    strategy?.poolTotalSupply,
  ]);

  /* set max for removal with a vault  */
  useEffect(() => {
    /* if series is mature set max to user tokens, else set a max depending on if there is a vault */
    strategy &&
      strategySeries &&
      matchingVault &&
      setMaxRemoveWithVault(ethers.utils.formatUnits(strategy?.accountBalance!, strategySeries.decimals));
  }, [_input, matchingVault, strategy, strategySeries, vaultMap]);

  /* Check if can use 'buy and pool' method to get liquidity */
  useEffect(() => {
    if (strategySeries && _input.gt(ethers.constants.Zero)) {
      let _fyTokenToBuy = ethers.constants.Zero;

      const _maxFyTokenOut = maxFyTokenOut(
        strategySeries.baseReserves,
        strategySeries.fyTokenReserves,
        strategySeries.getTimeTillMaturity(),
        strategySeries.decimals
      );

      _fyTokenToBuy = fyTokenForMint(
        strategySeries.baseReserves,
        strategySeries.fyTokenRealReserves,
        strategySeries.fyTokenReserves,
        _input,
        strategySeries.getTimeTillMaturity(),
        strategySeries.decimals
      );

      /* check if buy and pool option is allowed */
      const buyAndPoolAllowed = _fyTokenToBuy.gt(ethers.constants.Zero) && _fyTokenToBuy.lt(_maxFyTokenOut);

      console.log('fTokenToBuy, maxFyTokenOut ', _fyTokenToBuy.toString(), _maxFyTokenOut);
      setCanBuyAndPool(buyAndPoolAllowed);
      console.log('Can BuyAndPool?', buyAndPoolAllowed);
      console.log('fTokenToBuy: ', _fyTokenToBuy.toString());
      console.log('maxFyTokenOut: ', _maxFyTokenOut.toString());
    } else {
      /* allowed by default */
      setCanBuyAndPool(false);
    }
  }, [_input, strategySeries]);

  /* CHECK FOR ANY VAULTS WITH THE SAME BASE/ILK */
  useEffect(() => {
    if (strategySeries && strategyBase && strategySeries) {
      const [, _fyTokenPortion] = splitLiquidity(
        strategySeries?.baseReserves,
        strategySeries?.fyTokenReserves,
        strategy?.accountBalance! // _input
      );
      const arr: IVault[] = Array.from(vaultMap.values()) as IVault[];
      const _matchingVault = arr.find(
        (v: IVault) =>
          v.ilkId === strategyBase.id &&
          v.baseId === strategyBase.id &&
          v.seriesId === strategySeries.id &&
          v.art.gte(_fyTokenPortion) &&
          v.isActive
      );
      setMatchingVault(_matchingVault);
      console.log('Matching Vault:', _matchingVault?.id || 'No matching vault.');
    } else {
      setMatchingVault(undefined);
    }
  }, [vaultMap, strategyBase, strategySeries, strategy]);

  /* SET MAX VALUES */
  useEffect(() => {
    if (activeAccount) {
      /* Checks asset selection and sets the max available value */
      (async () => {
        const max = await strategyBase?.getBalance(activeAccount);
        if (max) setMaxPool(ethers.utils.formatUnits(max, strategyBase?.decimals).toString());
      })();
    }
  }, [input, activeAccount, strategyBase]);

  useEffect(() => {
    if (_input !== ethers.constants.Zero && strategy) {
      setPoolPercentPreview(cleanValue(getPoolPercent(_input, strategy?.strategyTotalSupply!), 3));
    }
  }, [_input, strategy]);

  return {
    maxPool,
    poolPercentPreview,
    canBuyAndPool,
    matchingVault,
    maxRemoveNoVault,
    maxRemoveWithVault,

    healthyBaseReserves,

    fyTokenTradePossible,

    inputTradeValue,
    inputTradeValue_,
    accountTradeValue,
  };
};

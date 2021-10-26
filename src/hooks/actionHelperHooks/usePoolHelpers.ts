import { useContext, useEffect, useState } from 'react';
import { ethers, BigNumber } from 'ethers';
import { UserContext } from '../../contexts/UserContext';
import { IAsset, ISeries, IStrategy, IVault } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import {
  fyTokenForMint,
  splitLiquidity,
  strategyTokenValue,
  getPoolPercent,
  maxFyTokenOut,
  burnFromStrategy,
  burn,
  sellFYToken,
} from '../../utils/yieldMath';
import { ZERO_BN } from '../../utils/constants';
import { Strategy } from '../../contracts';

export const usePoolHelpers = (input: string | undefined, removeLiquidityView: boolean = false) => {
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
      slippageTolerance,
    },
  } = useContext(UserContext);

  const strategy: IStrategy | undefined = strategyMap?.get(selectedStrategyAddr);
  const strategySeries: ISeries | undefined = seriesMap?.get(
    selectedStrategyAddr ? strategy?.currentSeriesId : selectedSeries
  );
  const strategyBase: IAsset | undefined = assetMap?.get(selectedStrategyAddr ? strategy?.baseId : selectedBaseId);

  /* LOCAL STATE */
  const [_input, setInput] = useState<BigNumber>(ethers.constants.Zero);

  const [matchingVault, setMatchingVault] = useState<IVault | undefined>();

  const [poolPercentPreview, setPoolPercentPreview] = useState<string | undefined>();

  const [maxPool, setMaxPool] = useState<string | undefined>();
  const [canBuyAndPool, setCanBuyAndPool] = useState<boolean | undefined>(false);
  // const [healthyBaseReserves, setHealthyBaseReserves] = useState<boolean>();

  const [addTradePossible, setAddTradePossible] = useState<boolean>();
  const [inputTradeValue, setInputTradeValue] = useState<BigNumber | undefined>();
  const [inputTradeValue_, setInputTradeValue_] = useState<string | undefined>();
  const [accountTradeValue, setAccountTradeValue] = useState<string | undefined>();

  /* remove liquidity helpers */
  const [maxRemoveNoVault, setMaxRemoveNoVault] = useState<string | undefined>();
  const [maxRemoveWithVault, setMaxRemoveWithVault] = useState<string | undefined>();
  const [removeTradePossible, setRemoveTradePossible] = useState<boolean>(true);

  /* Set input (need to make sure we can parse the input value) */
  useEffect(() => {
    if (input) {
      try {
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

  useEffect(() => {
    if (_input !== ethers.constants.Zero && strategy && strategySeries) {
      setPoolPercentPreview(cleanValue(getPoolPercent(_input, strategy?.strategyTotalSupply!), 3));
    }
  }, [_input, strategy, strategySeries]);

  /* check account token trade value */
  useEffect(() => {
    if (
      strategy &&
      strategySeries &&
      strategy?.strategyPoolBalance?.gt(ZERO_BN) &&
      strategy?.accountBalance?.gt(ZERO_BN) &&
      strategy?.strategyTotalSupply?.gt(ZERO_BN)
    ) {
      const [_sellValue, _tokenValue] = strategyTokenValue(
        strategy?.accountBalance || ethers.constants.Zero,
        strategy?.strategyTotalSupply,
        strategy?.strategyPoolBalance,
        strategySeries.baseReserves,
        strategySeries.fyTokenRealReserves,
        strategySeries.totalSupply,
        strategySeries.getTimeTillMaturity(),
        strategySeries.decimals
      );
      const tradeable = _sellValue.gt(ethers.constants.Zero);
      tradeable && setAccountTradeValue(ethers.utils.formatUnits(_tokenValue, strategy.decimals));
    }

    strategy?.accountBalance?.eq(ethers.constants.Zero) && setAccountTradeValue('0');
  }, [strategy, strategySeries]);

  /* Set the trade value and check if base reserves are too low for specific input  */
  useEffect(() => {
    if (_input !== ethers.constants.Zero && strategySeries) {
      const [_sellValue, _tokenValue] = strategyTokenValue(
        _input,
        strategy?.strategyTotalSupply!,
        strategy?.strategyPoolBalance!,
        strategySeries.baseReserves,
        strategySeries.fyTokenRealReserves,
        strategySeries.totalSupply,
        strategySeries.getTimeTillMaturity(),
        strategySeries.decimals
      );
      const tradeable = _sellValue.gt(ethers.constants.Zero);
      // console.log('Is tradeable:', tradeable);
      setAddTradePossible(tradeable);
      setInputTradeValue(_tokenValue);
      setInputTradeValue_(ethers.utils.formatUnits(_tokenValue, strategySeries.decimals));
    }
  }, [_input, strategy, strategySeries]);

  /* Check if can use 'buy and pool' method to get liquidity */
  useEffect(() => {
    if (strategySeries && _input.gt(ethers.constants.Zero) && !removeLiquidityView) {
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
        strategySeries.decimals,
        slippageTolerance
      );

      /* Check if buy and pool option is allowed */
      const buyAndPoolAllowed = 
      _fyTokenToBuy.gt(ethers.constants.Zero) && 
      _fyTokenToBuy.lt(_maxFyTokenOut) &&
      parseFloat(strategySeries.apr) > 0.25;

      setCanBuyAndPool(buyAndPoolAllowed);
      console.log('Can BuyAndPool?', buyAndPoolAllowed);

    } else {
      /* Don't allow by default */
      setCanBuyAndPool(false);
    }
  }, [_input, strategySeries, removeLiquidityView, slippageTolerance]);

  /* SET MAX VALUES */
  useEffect(() => {
    if (activeAccount && !removeLiquidityView) {
      /* Checks asset selection and sets the max available value */
      (async () => {
        const max = await strategyBase?.getBalance(activeAccount);
        if (max) setMaxPool(ethers.utils.formatUnits(max, strategyBase?.decimals).toString());
      })();
    }
  }, [input, activeAccount, strategyBase, removeLiquidityView]);

  /**
   * Remove liquidity specific section
   * */

  /* Check for any vaults with the same series/ilk/base */
  useEffect(() => {
    if (strategySeries && strategyBase && strategySeries && removeLiquidityView) {
      const arr: IVault[] = Array.from(vaultMap.values()) as IVault[];
      const _matchingVault = arr.find(
        (v: IVault) =>
          v.ilkId === strategyBase.id && 
          v.baseId === strategyBase.id && 
          v.seriesId === strategySeries.id && 
          v.isActive
      );
      setMatchingVault(_matchingVault);
      console.log('Matching Vault:', _matchingVault?.id || 'No matching vault.');
    } else {
      setMatchingVault(undefined);
    }
  }, [vaultMap, strategyBase, strategySeries, removeLiquidityView]);

  /* set max for removal with/without a vault  */

  useEffect(() => {
    /* if series is mature set max to user tokens, else set a max depending on if there is a vault */
    removeLiquidityView &&
      strategy &&
      strategySeries &&
      matchingVault &&
      setMaxRemoveWithVault(
        ethers.utils.formatUnits(strategy?.accountBalance! || ethers.constants.Zero, strategySeries.decimals)
      );

    removeLiquidityView &&
      strategy &&
      strategySeries &&
      setMaxRemoveNoVault(
        ethers.utils.formatUnits(strategy?.accountBalance! || ethers.constants.Zero, strategySeries.decimals)
      );
  }, [matchingVault, strategy, strategySeries, removeLiquidityView]);

  useEffect(() => {
    if (_input !== ethers.constants.Zero && strategy && strategySeries && removeLiquidityView) {
      const [sellTokenValue] = strategyTokenValue(
        _input,
        strategy.strategyTotalSupply!,
        strategy.strategyPoolBalance!,
        strategySeries.baseReserves,
        strategySeries.fyTokenRealReserves,
        strategySeries.totalSupply,
        strategySeries.getTimeTillMaturity(),
        strategySeries.decimals
      );
      setRemoveTradePossible(sellTokenValue.gt(ethers.constants.Zero));
    }
  }, [_input, removeLiquidityView, strategy, strategySeries]);

  return {
    maxPool,
    poolPercentPreview,
    canBuyAndPool,

    matchingVault,

    maxRemoveNoVault,
    maxRemoveWithVault,

    addTradePossible,
    removeTradePossible,

    inputTradeValue,
    inputTradeValue_,
    accountTradeValue,
  };
};

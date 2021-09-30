import { useCallback, useContext, useEffect, useState } from 'react';
import { ethers, BigNumber } from 'ethers';
import { UserContext } from '../../contexts/UserContext';
import { IAsset, ISeries, IStrategy, IVault } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import {
  mulDecimal,
  divDecimal,
  fyTokenForMint,
  maxBaseToSpend,
  splitLiquidity,
  burn,
  sellFYToken,
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
  const [canBuyAndPool, setCanBuyAndPool] = useState<boolean | undefined>(true);

  /* remove liquidity helpers */
  const [matchingVault, setMatchingVault] = useState<IVault | undefined>();
  const [maxRemoveNoVault, setMaxRemoveNoVault] = useState<string | undefined>();
  const [maxRemoveWithVault, setMaxRemoveWithVault] = useState<string | undefined>();

  const [healthyBaseReserves, setHealthyBaseReserves] = useState<boolean>();
  const [fyTokenTradePossible, setFyTokenTradePossible] = useState<boolean>();

  const [inputTradeValue, setInputTradeValue] = useState<string | undefined>();
  const [accountTradeValue, setAccountTradeValue] = useState<string | undefined>();

  const checkTrade = useCallback(
    (tradeInput: BigNumber): BigNumber => {
      // 1. calc amount base/fytonken recieved from burn
      // 2. calculate new reseverves ( base reserves and fytokesreserevs)
      // 3. try trade with new reserves 
      if (strategySeries) {
        const [_baseTokens, _fytokens] = burn(
          strategySeries.baseReserves,
          strategySeries.fyTokenReserves,
          strategySeries.totalSupply,
          tradeInput
        );
        const newBaseReserves = strategySeries.baseReserves.sub(_baseTokens);
        const newFyTokenReserves = strategySeries.fyTokenReserves.sub(_fytokens);
        const sellOutcome = sellFYToken(
          newBaseReserves,
          newFyTokenReserves,
          _fytokens,
          strategySeries.getTimeTillMaturity(),
          strategySeries.decimals
        );
        return sellOutcome;
      }
      return ZERO_BN;
    },
    [strategySeries]
  );

  /* set input (need to make sure we can parse the input value) */
  useEffect(() => {
    if (input) {
      try {
        const parsedInput = ethers.utils.parseUnits(input!, strategyBase?.decimals);
        setInput(parsedInput);
      } catch (e) {
        console.log(e);
      }
    } else {
      setInput(ethers.constants.Zero);
    }
  }, [input, strategyBase]);

  /* Check if base reserves are too low for max trade  */
  useEffect(() => {
    if (strategy && strategySeries) {
      const tradeable = checkTrade(strategy.accountBalance!).gt(ethers.constants.Zero);
      setHealthyBaseReserves(tradeable);
      setMaxRemoveNoVault(ethers.utils.formatUnits(strategy?.accountBalance!, strategySeries.decimals));
    }
  }, [checkTrade, strategy, strategySeries]);

  /* set the trade value and check if base reserves are too low for specific input  */
  useEffect(() => {
    if (strategySeries) {
      const _tradeValue = checkTrade(_input);
      const tradeable = _tradeValue.gt(ethers.constants.Zero);
      console.log('Is tradeable:', tradeable);
      setFyTokenTradePossible(tradeable);
      setInputTradeValue(ethers.utils.formatUnits(_tradeValue, strategySeries.decimals));
    }
  }, [_input, checkTrade, strategySeries]);

  /* check account token trade value */
  useEffect(() => {
    if (strategy?.accountBalance?.gt(ZERO_BN) ) {
      const _tradeValue = checkTrade(strategy?.accountBalance);
      const tradeable = _tradeValue.gt(ethers.constants.Zero);
      tradeable && setAccountTradeValue(ethers.utils.formatUnits(_tradeValue, strategy.decimals));
    }
  }, [checkTrade, strategy?.accountBalance, strategy?.decimals]);

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
      const _maxProtocol = maxBaseToSpend(
        strategySeries.baseReserves,
        strategySeries.fyTokenReserves,
        strategySeries.getTimeTillMaturity()
      );

      // console.log( strategySeries.baseReserves.toString() )
      if (
        _input.lt(strategySeries.baseReserves.mul(2)) &&
        strategySeries.baseReserves.gt(ethers.utils.parseUnits('10', strategySeries.decimals)) // only if greater than 10
      ) {
        _fyTokenToBuy = fyTokenForMint(
          strategySeries.baseReserves,
          strategySeries.fyTokenRealReserves,
          strategySeries.fyTokenReserves,
          _input,
          strategySeries.getTimeTillMaturity(),
          strategySeries.decimals
        );
        console.log('can buyAndPool?', _maxProtocol.lt(_fyTokenToBuy));
        setCanBuyAndPool(_maxProtocol.lt(_fyTokenToBuy));
      }
    } else {
      console.log('canbuy and pool reset');
      setCanBuyAndPool(true);
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
      // update the below to get an actual estimated token value based on the input
      // const _poolTokenPreview = ethers.utils.parseUnits(input, strategyBase?.decimals);
      const _poolPercentPreview = cleanValue(mulDecimal(divDecimal(_input, strategy.strategyTotalSupply!), '100'), 2);
      setPoolPercentPreview(_poolPercentPreview);
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
    accountTradeValue,
  };
};

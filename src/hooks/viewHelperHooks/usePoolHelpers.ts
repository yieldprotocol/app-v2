import { useContext, useEffect, useState } from 'react';
import { ethers, BigNumber } from 'ethers';
import { UserContext } from '../../contexts/UserContext';
import { IAsset, ISeries, ISettingsContext, IStrategy, IVault } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import {
  fyTokenForMint,
  strategyTokenValue,
  getPoolPercent,
  maxFyTokenOut,
  burnFromStrategy,
  burn,
  calculateSlippage,
  sellFYToken,
  secondsToFrom,
} from '../../utils/yieldMath';
import { SettingsContext } from '../../contexts/SettingsContext';
import { ZERO_BN } from '../../utils/constants';

export const usePoolHelpers = (input: string | undefined, removeLiquidityView: boolean = false) => {
  /* STATE FROM CONTEXT */
  const {
    settingsState: { slippageTolerance, diagnostics },
  } = useContext(SettingsContext) as ISettingsContext;

  const {
    userState: { selectedSeries, selectedBase, selectedStrategy, seriesMap, vaultMap, assetMap, activeAccount },
  } = useContext(UserContext);

  const strategy: IStrategy | undefined = selectedStrategy;
  const strategySeries: ISeries | undefined = seriesMap?.get(
    selectedStrategy ? strategy?.currentSeriesId : selectedSeries
  );

  const strategyBase: IAsset | undefined = assetMap?.get(selectedStrategy ? strategy?.baseId : selectedBase?.proxyId);

  /* LOCAL STATE */

  const [_input, setInput] = useState<BigNumber>(ethers.constants.Zero);
  const [matchingVault, setMatchingVault] = useState<IVault | undefined>();

  const [poolPercentPreview, setPoolPercentPreview] = useState<string | undefined>();
  const [maxPool, setMaxPool] = useState<string | undefined>();
  const [canBuyAndPool, setCanBuyAndPool] = useState<boolean | undefined>(false);

  // const [inputTradeValue, setInputTradeValue] = useState<BigNumber | undefined>();
  // const [inputTradeValue_, setInputTradeValue_] = useState<string | undefined>();
  // const [accountTradeValue, setAccountTradeValue] = useState<string | undefined>();

  /* remove liquidity helpers */
  const [maxRemoveNoVault, setMaxRemoveNoVault] = useState<string | undefined>();
  const [maxRemoveWithVault, setMaxRemoveWithVault] = useState<string | undefined>();

  const [partialRemoveRequired, setPartialRemoveRequired] = useState<boolean>(false);

  const [removeBaseReceived, setRemoveBaseReceived] = useState<BigNumber | undefined>();
  const [removeBaseReceived_, setRemoveBaseReceived_] = useState<string | undefined>();

  const [removeFyTokenReceived, setRemoveFyTokenReceived] = useState<BigNumber | undefined>(ethers.constants.Zero);
  const [removeFyTokenReceived_, setRemoveFyTokenReceived_] = useState<string | undefined>('0');

  /**
   * GENERAL SECTION - BOTH ADD & REMOVE
   * */

  /* Check for any vaults with the same series/ilk/base for REMOVING LIQUIDITY -> */
  useEffect(() => {
    if (strategySeries && strategyBase) {
      const arr: IVault[] = Array.from(vaultMap.values()) as IVault[];
      const _matchingVault = arr
        .sort((vaultA: IVault, vaultB: IVault) => (vaultA.id > vaultB.id ? 1 : -1))
        .sort((vaultA: IVault, vaultB: IVault) => (vaultA.art.lt(vaultB.art) ? 1 : -1))
        .find(
          (v: IVault) =>
            v.ilkId === strategyBase.proxyId &&
            v.baseId === strategyBase.proxyId &&
            v.seriesId === strategySeries.id &&
            v.isActive
        );
      setMatchingVault(_matchingVault);
      diagnostics && console.log('Matching Vault:', _matchingVault?.id || 'No matching vault.');
    } else {
      setMatchingVault(undefined);
    }
  }, [vaultMap, strategy, strategyBase, strategySeries, removeLiquidityView, diagnostics]);

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

  /**
   * ADD LIQUIDITY SPECIFIC  SECTION
   * */

  /* Pool percentage preview */
  useEffect(() => {
    if (_input !== ethers.constants.Zero && strategy && strategySeries && !removeLiquidityView) {
      setPoolPercentPreview(cleanValue(getPoolPercent(_input, strategy?.strategyTotalSupply!), 3));
    }
  }, [_input, removeLiquidityView, strategy, strategySeries]);

  /* Check if can use 'buy and pool' method to get liquidity */
  useEffect(() => {
    if (strategySeries && _input.gt(ethers.constants.Zero) && !removeLiquidityView) {
      let _fyTokenToBuy = ethers.constants.Zero;

      const _maxFyTokenOut = maxFyTokenOut(
        strategySeries.baseReserves,
        strategySeries.fyTokenReserves,
        strategySeries.getTimeTillMaturity(),
        strategySeries.ts,
        strategySeries.g1,
        strategySeries.decimals
      );

      [_fyTokenToBuy] = fyTokenForMint(
        strategySeries.baseReserves,
        strategySeries.fyTokenRealReserves,
        strategySeries.fyTokenReserves,
        calculateSlippage(_input, slippageTolerance.toString(), true),
        strategySeries.getTimeTillMaturity(),
        strategySeries.ts,
        strategySeries.g1,
        strategySeries.decimals,
        slippageTolerance
      );

      /* Check if buy and pool option is allowed */
      const buyAndPoolAllowed =
        _fyTokenToBuy.gt(ethers.constants.Zero) &&
        _fyTokenToBuy.lt(_maxFyTokenOut) &&
        parseFloat(strategySeries.apr) > 0.25;

      setCanBuyAndPool(buyAndPoolAllowed);
      diagnostics && console.log('Can BuyAndPool?', buyAndPoolAllowed);
    } else {
      /* Don't allow by default */
      setCanBuyAndPool(false);
    }
  }, [_input, strategySeries, removeLiquidityView, slippageTolerance, diagnostics]);

  /* Set Max Pool > effectively user balance */
  useEffect(() => {
    if (activeAccount && !removeLiquidityView) {
      /* Checks asset selection and sets the max available value */
      (async () => {
        const max = await selectedBase?.getBalance(activeAccount);
        if (max) setMaxPool(ethers.utils.formatUnits(max, selectedBase?.decimals).toString());
      })();
    }
  }, [input, activeAccount, removeLiquidityView, selectedBase]);

  /**
   * Remove Liquidity specific section
   * */

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

  /* Remove liquidity flow decision tree */
  useEffect(() => {
    if (_input !== ethers.constants.Zero && strategySeries && removeLiquidityView) {
      if (matchingVault) {
        /* Matching vault (with debt) exists: USE 1 , 2.1 or 2.2 */

        /* Check the amount of fyTokens potentially recieved */
        const lpReceived = burnFromStrategy(strategy?.strategyPoolBalance!, strategy?.strategyTotalSupply!, _input);
        const [_baseReceived, _fyTokenReceived] = burn(
          strategySeries?.baseReserves!,
          strategySeries?.fyTokenRealReserves!,
          strategySeries?.totalSupply!,
          lpReceived
        );
        diagnostics && console.log('burnt (base, fytokens)', _baseReceived.toString(), _fyTokenReceived.toString());

        if (_fyTokenReceived.gt(matchingVault?.accruedArt!)) {
          /* Fytoken received greater than debt : USE REMOVE OPTION 2.1 or 2.2 */
          diagnostics &&
            console.log(
              'FyTokens received will be greater than debt: an extra sellFytoken trade is required: REMOVE OPTION 2.1 or 2.2 '
            );

          const _extraFyTokensToSell = _fyTokenReceived.sub(matchingVault.accruedArt);
          diagnostics && console.log(_extraFyTokensToSell.toString(), 'FyTokens Need to be sold');

          const _extraFyTokenValue = sellFYToken(
            strategySeries?.baseReserves!,
            strategySeries?.fyTokenRealReserves!,
            _extraFyTokensToSell,
            secondsToFrom(strategySeries?.maturity.toString()),
            strategySeries?.ts,
            strategySeries?.g2,
            strategySeries?.decimals
          );

          if (_extraFyTokenValue.gt(ZERO_BN)) {
            /* CASE> extra fyToken TRADE IS POSSIBLE :  USE REMOVE OPTION 2.1? */
            diagnostics && console.log('USE REMOVE OPTION 2.1');
            setPartialRemoveRequired(false);
            const _val = _baseReceived.add(_extraFyTokenValue); // .add(_fyTokenReceived);
            setRemoveBaseReceived(_val);
            setRemoveBaseReceived_(ethers.utils.formatUnits(_val, strategySeries.decimals));
            setRemoveFyTokenReceived(ethers.constants.Zero);
            setRemoveFyTokenReceived_('0');
          } else {
            /* CASE> extra fyToken TRADE NOT POSSIBLE ( limited by protocol ): USE REMOVE OPTION 2.2 */
            diagnostics && console.log('USE REMOVE OPTION 2.2');
            setPartialRemoveRequired(true);
            const _fyTokenVal = _fyTokenReceived.sub(matchingVault.accruedArt);
            const _baseVal = _baseReceived; // .add(matchingVault.art);
            setRemoveBaseReceived(_baseVal);
            setRemoveBaseReceived_(ethers.utils.formatUnits(_baseVal, strategySeries.decimals));
            setRemoveFyTokenReceived(_fyTokenVal);
            setRemoveFyTokenReceived_(ethers.utils.formatUnits(_fyTokenVal, strategySeries.decimals));
          }
        } else {
          /* CASE> fytokenReceived less than debt : USE REMOVE OPTION 1 */
          diagnostics &&
            console.log(
              'FyTokens received will Less than debt: straight No extra trading is required : USE REMOVE OPTION 1 '
            );
          setPartialRemoveRequired(false);
          const _val = _baseReceived; // .add(_fyTokenReceived);
          setRemoveBaseReceived(_val);
          setRemoveBaseReceived_(ethers.utils.formatUnits(_val, strategySeries.decimals));
          setRemoveFyTokenReceived(ethers.constants.Zero);
          setRemoveFyTokenReceived_('0');
        }
      } else {
        /* CASE > No matching vault exists : USE REMOVE OPTION 4 */

        /* Check the amount of fyTokens potentially recieved */
        const lpReceived = burnFromStrategy(strategy?.strategyPoolBalance!, strategy?.strategyTotalSupply!, _input);
        const [_baseReceived, _fyTokenReceived] = burn(
          strategySeries?.baseReserves!,
          strategySeries?.fyTokenRealReserves!,
          strategySeries?.totalSupply!,
          lpReceived
        );

        /* Calculate the token Value */
        const [tokenSellValue, totalTokenValue] = strategyTokenValue(
          _input,
          strategy?.strategyTotalSupply!,
          strategy?.strategyPoolBalance!,
          strategySeries?.baseReserves,
          strategySeries?.fyTokenRealReserves,
          strategySeries?.totalSupply!,
          strategySeries.getTimeTillMaturity(),
          strategySeries.ts,
          strategySeries.g2,
          strategySeries.decimals
        );

        if (tokenSellValue.gt(ethers.constants.Zero)) {
          diagnostics && console.log('NO VAULT : pool trade is possible  : USE REMOVE OPTION 4.1 ');
          setPartialRemoveRequired(false);

          const _val = totalTokenValue;
          setRemoveBaseReceived(_val);
          setRemoveBaseReceived_(ethers.utils.formatUnits(_val, strategySeries.decimals));
          setRemoveFyTokenReceived(ethers.constants.Zero);
          setRemoveFyTokenReceived_('0');
        } else {
          diagnostics && console.log('NO VAULT : trade not possible : USE REMOVE OPTION 4.2');
          setPartialRemoveRequired(true);
          setRemoveBaseReceived(_baseReceived);
          setRemoveBaseReceived_(ethers.utils.formatUnits(_baseReceived, strategySeries.decimals));
          setRemoveFyTokenReceived(_fyTokenReceived);
          setRemoveFyTokenReceived_(ethers.utils.formatUnits(_fyTokenReceived, strategySeries.decimals));
        }
      }
    }
  }, [strategy, _input, strategySeries, matchingVault, removeLiquidityView, diagnostics]);

  return {
    maxPool,
    poolPercentPreview,
    canBuyAndPool,

    matchingVault,

    maxRemoveNoVault,
    maxRemoveWithVault,

    partialRemoveRequired,

    removeBaseReceived,
    removeFyTokenReceived,
    removeBaseReceived_,
    removeFyTokenReceived_,
  };
};

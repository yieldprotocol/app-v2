import { useContext, useEffect, useState } from 'react';
import { ethers, BigNumber } from 'ethers';
import { UserContext } from '../../contexts/UserContext';
import { ChainContext } from '../../contexts/ChainContext';
import { IAsset, ISeries, IStrategy, IVault } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import { mulDecimal, divDecimal, fyTokenForMint, maxBaseToSpend, splitLiquidity } from '../../utils/yieldMath';

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
  const [matchingVault, setMatchingVault] = useState<IVault | undefined>();

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

  /* Check if can use 'buy and pool ' method to get liquidity */
  useEffect(() => {
    if (strategySeries && _input.gt(ethers.constants.Zero)) {
      const [_baseProtion, _fyTokenPortion] = splitLiquidity(
        strategySeries?.baseReserves,
        strategySeries?.fyTokenReserves,
        _input
      );
    }
  }, [_input, strategySeries]);

  /* Check if can use 'buy and pool ' method to get liquidity */
  useEffect(() => {
    if (strategySeries && _input.gt(ethers.constants.Zero)) {
      const [, _fyTokenPortion] = splitLiquidity(strategySeries?.baseReserves, strategySeries?.fyTokenReserves, _input);

      let _fyTokenToBuy = ethers.constants.Zero;
      const _maxProtocol = maxBaseToSpend(
        strategySeries.baseReserves,
        strategySeries.fyTokenReserves,
        strategySeries.getTimeTillMaturity()
      );
      if (_input.lt(strategySeries.baseReserves.mul(2))) {
        _fyTokenToBuy = fyTokenForMint(
          strategySeries.baseReserves,
          strategySeries.fyTokenRealReserves,
          strategySeries.fyTokenReserves,
          _input,
          strategySeries.getTimeTillMaturity(),
          strategySeries.decimals
        );
        setCanBuyAndPool(_maxProtocol.lt(_fyTokenToBuy));
      }
    }
  }, [_input, strategySeries]);

  /* CHECK FOR ANY VAULTS WITH THE SAME BASE/ILK */
  useEffect(() => {
    if (strategyBase && strategySeries && _input.gt(ethers.constants.Zero)) {
      const [, _fyTokenPortion] = splitLiquidity(strategySeries?.baseReserves, strategySeries?.fyTokenReserves, _input);
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
  }, [vaultMap, strategyBase, strategySeries, _input]);

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

  return { maxPool, poolPercentPreview, canBuyAndPool, matchingVault };
};

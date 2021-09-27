import { useContext, useEffect, useState } from 'react';
import { ethers, BigNumber } from 'ethers';
import { UserContext } from '../../contexts/UserContext';
import { ChainContext } from '../../contexts/ChainContext';
import { IAsset, ISeries, IStrategy, IVault } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import { mulDecimal, divDecimal, fyTokenForMint } from '../../utils/yieldMath';

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

  const _input = input ? ethers.utils.parseUnits(input!, strategyBase?.decimals) : ethers.constants.Zero;

  /* LOCAL STATE */
  const [poolPercentPreview, setPoolPercentPreview] = useState<string | undefined>();
  const [maxPool, setMaxPool] = useState<string | undefined>();
  const [canBuyAndPool, setCanBuyAndPool] = useState<boolean | undefined>();

  const [matchingVault, setMatchingVault] = useState<IVault | undefined>();

  /* Check if can use 'buy and pool ' method to get liquidity */
  useEffect(() => {

    if (strategySeries && 
      _input.gt(ethers.constants.Zero) &&
      _input.lt(strategySeries.baseReserves.mul(2))
      ) {
      const _fyTokenToBuy = fyTokenForMint(
        strategySeries.baseReserves,
        strategySeries.fyTokenRealReserves,
        strategySeries.fyTokenReserves,
        _input,
        strategySeries.getTimeTillMaturity(),
        strategySeries.decimals
      );
      const _maxProtocol = strategySeries?.fyTokenReserves.sub(strategySeries?.baseReserves).div(2);
      setCanBuyAndPool(_maxProtocol.lt(_fyTokenToBuy));
    } else {
      setCanBuyAndPool(false);
    }

  }, [_input, strategySeries]);

  /* CHECK FOR ANY VAULTS WITH THE SAME BASE/ILK */
  useEffect(() => {
    if (strategyBase && strategySeries) {
      const arr: IVault[] = Array.from(vaultMap.values()) as IVault[];
      const _matchingVault = arr.find(
        (v: IVault) =>
          v.ilkId === strategyBase.id && v.baseId === strategyBase.id && v.seriesId === strategySeries.id && v.isActive
      );
      setMatchingVault(_matchingVault);
    }
  }, [vaultMap, strategyBase, strategySeries]);

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

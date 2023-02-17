import { ethers } from 'ethers';
import { useCallback, useContext, useEffect, useState } from 'react';
import { sellFYToken, strategyTokenValue } from '@yield-protocol/ui-math';

import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { IAssetPair, ISeries, IStrategy, IVault } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import { DAI, USDC, WETH } from '../../config/assets';
import { ZERO_BN } from '../../utils/constants';
import useTimeTillMaturity from '../useTimeTillMaturity';
import useAssetPair from '../useAssetPair';

interface ILendPosition extends ISeries {
  currentValue_: string | undefined;
}

interface IStrategyPosition extends IStrategy {
  currentValue_: string | undefined;
}

export const useDashboardHelpers = () => {
  /* STATE FROM CONTEXT */
  const {
    settingsState: { dashHideEmptyVaults, dashHideInactiveVaults, dashCurrency },
  } = useContext(SettingsContext);

  const {
    userState: { assetMap, vaultMap, seriesMap, strategyMap },
  } = useContext(UserContext);

  const { getTimeTillMaturity } = useTimeTillMaturity();
  const pairMap: Map<string, IAssetPair> = new Map();
  const [assetId, setAssetId] = useState<any>();

  const currencySettingAssetId = dashCurrency === WETH ? WETH : USDC;
  const currencySettingDigits = 2;
  const currencySettingSymbol = dashCurrency === WETH ? 'Ξ' : '$';

  const [vaultPositions, setVaultPositions] = useState<IVault[]>([]);
  const [lendPositions, setLendPositions] = useState<ILendPosition[]>([]);
  const [strategyPositions, setStrategyPositions] = useState<IStrategyPosition[]>([]);

  const [totalDebt, setTotalDebt] = useState<string | null>(null);
  const [totalCollateral, setTotalCollateral] = useState<string | null>(null);
  const [totalLendBalance, setTotalLendBalance] = useState<string | null>(null);
  const [totalStrategyBalance, setTotalStrategyBalance] = useState<string | null>(null);

  /* set vault positions */
  useEffect(() => {
    const _vaultPositions = Array.from(vaultMap?.values()!)
      .filter((vault) => (dashHideInactiveVaults ? vault.isActive : true))
      .filter((vault) => (dashHideEmptyVaults ? vault.ink.gt(ZERO_BN) || vault.accruedArt.gt(ZERO_BN) : true))
      .filter((vault) => vault.baseId !== vault.ilkId)
      .sort((vaultA, vaultB) => (vaultA.art.lt(vaultB.art) ? 1 : -1));
    setVaultPositions(_vaultPositions);
  }, [vaultMap, dashHideInactiveVaults, dashHideEmptyVaults]);

  /* set lend positions */
  useEffect(() => {
    const _lendPositions: ILendPosition[] = Array.from(seriesMap?.values()!)
      .map((_series) => {
        const currentValue =
          _series.seriesIsMature && _series.fyTokenBalance
            ? _series.fyTokenBalance
            : sellFYToken(
                _series.sharesReserves,
                _series.fyTokenReserves,
                _series.fyTokenBalance || ethers.constants.Zero,
                getTimeTillMaturity(_series.maturity),
                _series.ts,
                _series.g2,
                _series.decimals,
                _series.c,
                _series.mu
              );
        const currentValue_ =
          currentValue.lte(ethers.constants.Zero) && _series.fyTokenBalance?.gt(ethers.constants.Zero)
            ? _series.fyTokenBalance_
            : ethers.utils.formatUnits(currentValue, _series.decimals);
        return { ..._series, currentValue_ };
      })
      .filter((_series: ILendPosition) => _series.fyTokenBalance?.gt(ZERO_BN))
      .sort((_seriesA: ILendPosition, _seriesB: ILendPosition) =>
        _seriesA.fyTokenBalance?.gt(_seriesB.fyTokenBalance!) ? 1 : -1
      );
    setLendPositions(_lendPositions);
  }, [getTimeTillMaturity, seriesMap]);

  /* set strategy positions */
  useEffect(() => {
    const _strategyPositions: IStrategyPosition[] = Array.from(strategyMap?.values()!)
      .map((_strategy) => {
        if (!_strategy.strategyPoolBalance) return { ..._strategy, currentValue_: _strategy.accountBalance_ };
        // const currentStrategySeries = seriesMap.get(_strategy.currentSeries.id);
        const currentStrategySeries = _strategy.currentSeries;
        const [fyTokenToShares, sharesReceived] = strategyTokenValue(
          _strategy?.accountBalance || ethers.constants.Zero,
          _strategy?.strategyTotalSupply || ethers.constants.Zero,
          _strategy?.strategyPoolBalance || ethers.constants.Zero,
          currentStrategySeries?.sharesReserves!,
          currentStrategySeries?.fyTokenReserves!,
          currentStrategySeries?.totalSupply!,
          getTimeTillMaturity(currentStrategySeries?.maturity!),
          currentStrategySeries?.ts!,
          currentStrategySeries?.g2!,
          currentStrategySeries?.decimals!,
          currentStrategySeries?.c,
          currentStrategySeries?.mu
        );
        const currentValue_ = fyTokenToShares.gt(ethers.constants.Zero) // if we can sell all fyToken to shares
          ? ethers.utils.formatUnits(
              currentStrategySeries?.getBase(fyTokenToShares).add(currentStrategySeries?.getBase(sharesReceived))!, // add shares received to fyTokenToShares (in base)
              currentStrategySeries?.decimals
            )
          : _strategy.accountBalance_; // if we can't sell all fyToken, just use account strategy token balance (rough estimate of current value)

        return { ..._strategy, currentValue_ };
      })
      .filter((_strategy) => _strategy.accountBalance?.gt(ZERO_BN))
      .sort((_strategyA, _strategyB) => (_strategyA.accountBalance?.lt(_strategyB.accountBalance!) ? 1 : -1));
    setStrategyPositions(_strategyPositions);
  }, [strategyMap, seriesMap, getTimeTillMaturity]);

  /* get a single position's ink or art in dai or eth (input the asset id): value can be art, ink, fyToken, or pooToken balances */
  const convertValue = useCallback(
    (toAssetId: string = USDC, fromAssetId: string, value: string) => {
      const pair = pairMap.get(toAssetId + fromAssetId);
      return (
        Number(ethers.utils.formatUnits(pair?.pairPrice || ethers.constants.Zero, pair?.baseDecimals)) * Number(value)
      );
    },
    [pairMap]
  );

  /* Get pairInfo for each  */
  useEffect(() => {
    /* get list of unique assets used */
    const assetsUsedList = [
      ...new Set([
        ...vaultPositions.map((v) => v.baseId),
        ...vaultPositions.map((v) => v.ilkId),
        ...lendPositions.map((p) => p.baseId),
        ...strategyPositions.map((p) => p.baseId),
      ]),
    ];

    /* update asset pair if they don't exist already */
    assetsUsedList
      .filter((id: string) => id !== USDC && id !== WETH)
      .forEach(async (assetId: string) => {
        // setAssetId(assetId);
        // const ETHRates = await getPairInfo(ETH, assetId);
        // !pairMap.has(WETH + assetId) && ETHRates && pairMap.set(WETH + assetId, ETHRates);
        // !pairMap.has(USDC + assetId) && USDCRates && pairMap.set(USDC + assetId, USDCRates);
      });
  }, [lendPositions, strategyPositions, vaultPositions]);

  /* Everytime the pairmap changes, get the  new values/totals */
  useEffect(() => {
    /* calc total debt */
    const _debts = vaultPositions.map((position) =>
      pairMap.has(currencySettingAssetId + position.baseId) && position.isActive
        ? convertValue(currencySettingAssetId, position.baseId, position.accruedArt_)
        : 0
    );
    setTotalDebt(cleanValue(_debts.reduce((sum, debt) => sum + debt, 0).toFixed(), currencySettingDigits));

    /* calc total collateral */
    const _collateral = vaultPositions.map((position) =>
      pairMap.has(currencySettingAssetId + position.ilkId) && position.isActive
        ? convertValue(currencySettingAssetId, position.ilkId, position.ink_)
        : 0
    );
    setTotalCollateral(
      cleanValue(_collateral.reduce((sum, collateral) => sum + collateral, 0).toFixed(), currencySettingDigits)
    );
  }, [convertValue, currencySettingAssetId, pairMap, vaultPositions]);

  useEffect(() => {
    /* calc total lending */
    const _lendBalances = lendPositions.map((position) =>
      pairMap.has(currencySettingAssetId + position.baseId)
        ? convertValue(currencySettingAssetId, position.baseId, position.currentValue_!)
        : 0
    );
    setTotalLendBalance(
      cleanValue(_lendBalances.reduce((sum, lent) => sum + lent, 0).toFixed(), currencySettingDigits)
    );
  }, [convertValue, currencySettingAssetId, lendPositions, pairMap]);

  useEffect(() => {
    /* calc total strategies */
    const _strategyBalances = strategyPositions.map((position) =>
      pairMap.has(currencySettingAssetId + position.baseId)
        ? convertValue(currencySettingAssetId, position.baseId, position.currentValue_!)
        : 0
    );
    setTotalStrategyBalance(
      cleanValue(_strategyBalances.reduce((sum, val) => sum + val, 0).toString(), currencySettingDigits)
    );
  }, [convertValue, currencySettingAssetId, pairMap, strategyPositions]);

  return {
    vaultPositions,
    lendPositions,
    strategyPositions,
    totalDebt,
    totalCollateral,
    totalLendBalance,
    totalStrategyBalance,
    currencySettingDigits,
    currencySettingSymbol,
  };
};

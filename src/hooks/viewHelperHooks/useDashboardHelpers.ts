import { ethers } from 'ethers';
import { useCallback, useContext, useEffect, useState } from 'react';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import {
  ISeries,
  ISettingsContext,
  IStrategy,
  IUserContext,
  IUserContextActions,
  IUserContextState,
  IVault,
} from '../../types';
import { cleanValue } from '../../utils/appUtils';
import { USDC, WETH } from '../../config/assets';
import { ZERO_BN } from '../../utils/constants';
import { sellFYToken, strategyTokenValue } from '../../utils/yieldMath';

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
  } = useContext(SettingsContext) as ISettingsContext;

  const {
    userState: { vaultMap, assetPairMap, seriesMap, strategyMap },
    userActions: { updateAssetPair },
  }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(UserContext) as IUserContext;

  const currencySettingAssetId = dashCurrency === 'ETH' ? WETH : USDC;
  const currencySettingDigits = 2;
  const currencySettingSymbol = dashCurrency === 'ETH' ? 'Ξ' : '$';

  const [vaultPositions, setVaultPositions] = useState<IVault[]>([]);
  const [lendPositions, setLendPositions] = useState<ILendPosition[]>([]);
  const [strategyPositions, setStrategyPositions] = useState<IStrategyPosition[]>([]);

  const [totalDebt, setTotalDebt] = useState<string | null>(null);
  const [totalCollateral, setTotalCollateral] = useState<string | null>(null);
  const [totalLendBalance, setTotalLendBalance] = useState<string | null>(null);
  const [totalStrategyBalance, setTotalStrategyBalance] = useState<string | null>(null);

  /* set vault positions */
  useEffect(() => {
    const _vaultPositions = Array.from(vaultMap.values())
      .filter((vault) => (dashHideInactiveVaults ? vault.isActive : true))
      .filter((vault) => (dashHideEmptyVaults ? vault.ink.gt(ZERO_BN) || vault.art.gt(ZERO_BN) : true))
      .filter((vault) => vault.baseId !== vault.ilkId)
      .sort((vaultA, vaultB) => (vaultA.art.lt(vaultB.art) ? 1 : -1));
    setVaultPositions(_vaultPositions);
  }, [vaultMap, dashHideInactiveVaults, dashHideEmptyVaults]);

  /* set lend positions */
  useEffect(() => {
    const _lendPositions: ILendPosition[] = Array.from(seriesMap.values())
      .map((_series) => {
        const currentValue = sellFYToken(
          _series.baseReserves,
          _series.fyTokenReserves,
          _series.fyTokenBalance || ethers.constants.Zero,
          _series.getTimeTillMaturity(),
          _series.ts!,
          _series.g2!,
          _series.decimals!
        );

        const currentValue_ =
          currentValue.lte(ethers.constants.Zero) && _series.fyTokenBalance?.gt(ethers.constants.Zero)
            ? _series.fyTokenBalance_
            : ethers.utils.formatUnits(currentValue, _series.decimals!);
        return { ..._series, currentValue_ };
      })
      .filter((_series: ILendPosition) => _series.fyTokenBalance?.gt(ZERO_BN))
      .sort((_seriesA: ILendPosition, _seriesB: ILendPosition) =>
        _seriesA.fyTokenBalance?.gt(_seriesB.fyTokenBalance!) ? 1 : -1
      );
    setLendPositions(_lendPositions);
  }, [seriesMap]);

  /* set strategy positions */
  useEffect(() => {
    const _strategyPositions: IStrategyPosition[] = Array.from(strategyMap.values())
      .map((_strategy) => {
        const currentStrategySeries = seriesMap.get(_strategy.currentSeriesId);

        const [, currentValue] = strategyTokenValue(
          _strategy?.accountBalance || ethers.constants.Zero,
          _strategy?.strategyTotalSupply || ethers.constants.Zero,
          _strategy?.strategyPoolBalance || ethers.constants.Zero,
          currentStrategySeries?.baseReserves!,
          currentStrategySeries?.fyTokenRealReserves!,
          currentStrategySeries?.totalSupply!,
          currentStrategySeries?.getTimeTillMaturity()!,
          currentStrategySeries?.ts!,
          currentStrategySeries?.g2!,
          currentStrategySeries?.decimals!
        );
        const currentValue_ = currentValue.eq(ethers.constants.Zero)
          ? _strategy.accountBalance_
          : ethers.utils.formatUnits(currentValue, _strategy.decimals!);
        return { ..._strategy, currentValue_ };
      })
      .filter((_strategy) => _strategy.accountBalance?.gt(ZERO_BN))
      .sort((_strategyA, _strategyB) => (_strategyA.accountBalance?.lt(_strategyB.accountBalance!) ? 1 : -1));
    setStrategyPositions(_strategyPositions);
  }, [strategyMap, seriesMap]);

  /* get a single position's ink or art in dai or eth (input the asset id): value can be art, ink, fyToken, or pooToken balances */

  const convertValue = useCallback(
    async (toAssetId: string = USDC, fromAssetId: string, value: string) => {
      try {
        /* try get from state first */
        let pair = assetPairMap.get(toAssetId + fromAssetId);

        /* else update the pair data */
        if (!pair) {
          pair = await updateAssetPair(toAssetId, fromAssetId);
        }

        return (
          Number(ethers.utils.formatUnits(pair.pairPrice || ethers.constants.Zero, pair.baseDecimals)) * Number(value)
        );
      } catch (e) {
        console.log(e);
      }
      return 0;
    },
    [assetPairMap, updateAssetPair]
  );

  /* get vault, lend, and pool position total debt, collateral, and balances */
  useEffect(() => {
    async function getBalances() {
      const _debts = await Promise.all(
        vaultPositions.map((position) => convertValue(currencySettingAssetId, position.baseId, position.accruedArt_))
      );

      setTotalDebt(cleanValue(_debts.reduce((sum, debt) => sum + debt, 0).toString(), currencySettingDigits));

      const _collaterals = await Promise.all(
        vaultPositions.map((position) => convertValue(currencySettingAssetId, position.ilkId, position.ink_))
      );

      setTotalCollateral(
        cleanValue(_collaterals.reduce((sum, collateral) => sum + collateral, 0).toString(), currencySettingDigits)
      );

      const _lendBalances = await Promise.all(
        lendPositions.map((position) => convertValue(currencySettingAssetId, position.baseId, position.currentValue_!))
      );

      // using the current fyToken Value denominated in currency setting
      setTotalLendBalance(
        cleanValue(_lendBalances.reduce((sum, debt) => sum + debt, 0).toString(), currencySettingDigits)
      );

      const _strategyBalances = await Promise.all(
        strategyPositions.map((position) =>
          convertValue(currencySettingAssetId, position.baseId, position.currentValue_!)
        )
      );

      setTotalStrategyBalance(
        cleanValue(_strategyBalances.reduce((sum, debt) => sum + debt, 0).toString(), currencySettingDigits)
      );
    }

    getBalances();
  }, [currencySettingAssetId, convertValue, currencySettingDigits, vaultPositions, lendPositions, strategyPositions]);

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

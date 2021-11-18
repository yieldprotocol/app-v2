import { ethers } from 'ethers';
import { useCallback, useContext, useEffect, useState } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { UserContext } from '../contexts/UserContext';
import {
  ISeries,
  ISettingsContext,
  IStrategy,
  IUserContext,
  IUserContextActions,
  IUserContextState,
  IVault,
} from '../types';
import { cleanValue } from '../utils/appUtils';
import { DAI, WETH, ZERO_BN } from '../utils/constants';
import { sellFYToken, strategyTokenValue } from '../utils/yieldMath';

const useBalances = () => {
  /* STATE FROM CONTEXT */
  const {
    settingsState: { dashHideEmptyVaults, dashHideInactiveVaults, dashCurrency },
  } = useContext(SettingsContext) as ISettingsContext;

  const {
    userState: { vaultMap, assetMap, priceMap, seriesMap, strategyMap },
    userActions: { updatePrice },
  }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(UserContext) as IUserContext;

  const currencySettingAssetId = dashCurrency === 'ETH' ? WETH : DAI;
  const currencySettingDigits = dashCurrency === 'ETH' ? 4 : 2;
  const currencySettingSymbol = dashCurrency === 'ETH' ? 'Ξ' : '$';

  const [vaultPositions, setVaultPositions] = useState<IVault[]>([]);
  const [lendPositions, setLendPositions] = useState<ISeries[]>([]);
  const [strategyPositions, setStrategyPositions] = useState<IStrategy[]>([]);

  const [totalDebt, setTotalDebt] = useState<string>('');
  const [totalCollateral, setTotalCollateral] = useState<string>('');
  const [totalLendBalance, setTotalLendBalance] = useState<string>('');
  const [totalStrategyBalance, setTotalStrategyBalance] = useState<string>('');

  /* set vault positions */
  useEffect(() => {
    const _vaultPositions: IVault[] = Array.from(vaultMap.values())
      .filter((vault: IVault) => (dashHideInactiveVaults ? vault.isActive : true))
      .filter((vault: IVault) => (dashHideEmptyVaults ? vault.ink.gt(ZERO_BN) || vault.art.gt(ZERO_BN) : true))
      .filter((vault: IVault) => vault.baseId !== vault.ilkId)
      .sort((vaultA: IVault, vaultB: IVault) => (vaultA.art.lt(vaultB.art) ? 1 : -1));
    setVaultPositions(_vaultPositions);
  }, [vaultMap, dashHideInactiveVaults, dashHideEmptyVaults]);

  /* set lend positions */
  useEffect(() => {
    const _lendPositions: ISeries[] = Array.from(seriesMap.values())
      .map((_series: ISeries) => {
        const currentValue = sellFYToken(
          _series.baseReserves,
          _series.fyTokenReserves,
          _series.fyTokenBalance || ethers.constants.Zero,
          _series.getTimeTillMaturity(),
          _series.decimals!
        );

        const currentValue_ =
          currentValue.lte(ethers.constants.Zero) && _series.fyTokenBalance?.gt(ethers.constants.Zero)
            ? _series.fyTokenBalance_
            : ethers.utils.formatUnits(currentValue, _series.decimals!);
        return { ..._series, currentValue_ };
      })
      .filter((_series: ISeries) => _series.fyTokenBalance?.gt(ZERO_BN))
      .sort((_seriesA: ISeries, _seriesB: ISeries) => (_seriesA.fyTokenBalance?.gt(_seriesB.fyTokenBalance!) ? 1 : -1));
    setLendPositions(_lendPositions);
  }, [seriesMap]);

  /* set strategy positions */
  useEffect(() => {
    const _strategyPositions: IStrategy[] = Array.from(strategyMap.values())
      .map((_strategy: IStrategy) => {
        const currentStrategySeries: any = seriesMap.get(_strategy.currentSeriesId);

        const [, currentValue] = strategyTokenValue(
          _strategy?.accountBalance || ethers.constants.Zero,
          _strategy?.strategyTotalSupply || ethers.constants.Zero,
          _strategy?.strategyPoolBalance || ethers.constants.Zero,
          currentStrategySeries.baseReserves,
          currentStrategySeries.fyTokenRealReserves,
          currentStrategySeries.totalSupply,
          currentStrategySeries.getTimeTillMaturity(),
          currentStrategySeries.decimals
        );
        const currentValue_ = currentValue.eq(ethers.constants.Zero)
          ? _strategy.accountBalance_
          : ethers.utils.formatUnits(currentValue, _strategy.decimals!);
        return { ..._strategy, currentValue_ };
      })
      .filter((_strategy: IStrategy) => _strategy.accountBalance?.gt(ZERO_BN))
      .sort((_strategyA: IStrategy, _strategyB: IStrategy) =>
        _strategyA.accountBalance?.lt(_strategyB.accountBalance!) ? 1 : -1
      );
    setStrategyPositions(_strategyPositions);
  }, [strategyMap, seriesMap]);

  /* get a single position's ink or art in dai or eth (input the asset id): value can be art, ink, fyToken, or pooToken balances */
  const getPositionValue = useCallback(
    (baseOrIlkId: string, value: string, id = DAI) => {
      const base = assetMap?.get(baseOrIlkId);
      try {
        if (!priceMap.get(baseOrIlkId)?.has(id)) updatePrice(baseOrIlkId, id, base?.decimals!);
        const assetPrice = priceMap.get(baseOrIlkId)?.get(id);
        const assetValue = Number(ethers.utils.formatUnits(assetPrice || ethers.constants.Zero, 18)) * Number(value);
        return assetValue;
      } catch (e) {
        console.log(e);
        return 0;
      }
    },
    [priceMap, assetMap, updatePrice]
  );

  /* get vault, lend, and pool position total debt, collateral, and balances */
  useEffect(() => {
    const _debts = vaultPositions?.map((position: any) =>
      getPositionValue(position.baseId, position.art_, currencySettingAssetId)
    );
    setTotalDebt(
      cleanValue(_debts.reduce((sum: number, debt: number) => sum + debt, 0).toString(), currencySettingDigits)
    );

    const _collaterals = vaultPositions?.map((vault: IVault) =>
      getPositionValue(vault.ilkId, vault.ink_, currencySettingAssetId)
    );
    setTotalCollateral(
      cleanValue(
        _collaterals.reduce((sum: number, collateral: number) => sum + collateral, 0).toString(),
        currencySettingDigits
      )
    );

    const _lendBalances = lendPositions?.map((_series: any) =>
      getPositionValue(_series.baseId, _series.currentValue_!, currencySettingAssetId)
    );

    // using the current fyToken Value denominated in currency setting
    setTotalLendBalance(
      cleanValue(_lendBalances.reduce((sum: number, debt: number) => sum + debt, 0).toString(), currencySettingDigits)
    );

    const _strategyBalances = strategyPositions?.map((strategy: any) =>
      getPositionValue(strategy.baseId, strategy.currentValue_!, currencySettingAssetId)
    );

    setTotalStrategyBalance(
      cleanValue(
        _strategyBalances.reduce((sum: number, debt: number) => sum + debt, 0).toString(),
        currencySettingDigits
      )
    );
  }, [
    priceMap,
    currencySettingAssetId,
    getPositionValue,
    currencySettingDigits,
    vaultPositions,
    lendPositions,
    strategyPositions,
  ]);

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

export default useBalances;

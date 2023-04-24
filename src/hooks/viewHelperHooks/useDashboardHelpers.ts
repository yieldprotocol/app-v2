import { ethers } from 'ethers';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { sellFYToken, strategyTokenValue } from '@yield-protocol/ui-math';

import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { IAssetPair, ISeries, IStrategy, IVault } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import { USDC, USDT, WETH } from '../../config/assets';
import { ZERO_BN } from '../../utils/constants';
import useTimeTillMaturity from '../useTimeTillMaturity';
import useAssetPair from './useAssetPair';
import { unstable_serialize, useSWRConfig } from 'swr';
import { toast } from 'react-toastify';

interface ILendPosition extends ISeries {
  currentValue_: string | undefined;
}

interface IStrategyPosition extends IStrategy {
  currentValue_: string | undefined;
}

export const useDashboardHelpers = () => {
  const { cache, mutate } = useSWRConfig();

  /* STATE FROM CONTEXT */
  const {
    settingsState: { dashHideEmptyVaults, dashHideInactiveVaults, dashCurrency },
  } = useContext(SettingsContext);

  const {
    userState: { vaultMap, seriesMap, strategyMap },
  } = useContext(UserContext);

  const { getTimeTillMaturity } = useTimeTillMaturity();
  const { getAssetPair, genKey: genAssetPairKey } = useAssetPair();

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
          _series.seriesIsMature && _series.balance
            ? _series.balance
            : sellFYToken(
                _series.sharesReserves,
                _series.fyTokenReserves,
                _series.balance || ethers.constants.Zero,
                getTimeTillMaturity(_series.maturity),
                _series.ts,
                _series.g2,
                _series.decimals,
                _series.c,
                _series.mu
              );
        const currentValue_ =
          currentValue.lte(ethers.constants.Zero) && _series.balance?.gt(ethers.constants.Zero)
            ? _series.balance_
            : ethers.utils.formatUnits(currentValue, _series.decimals);
        return { ..._series, currentValue_ };
      })
      .filter((_series: ILendPosition) => _series.balance?.gt(ZERO_BN))
      .sort((_seriesA: ILendPosition, _seriesB: ILendPosition) => (_seriesA.balance?.gt(_seriesB.balance!) ? 1 : -1));
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

  /* get a single position's ink or art in usdc or eth (input the asset id): value can be art, ink, fyToken, or poolToken balances */
  const convertValue = useCallback(
    async (toAssetId: string = USDC, fromAssetId: string, value: string) => {
      if (+value === 0) return 0;
      if (toAssetId === fromAssetId) return Number(value);

      const pairKey = unstable_serialize(genAssetPairKey(toAssetId, fromAssetId));
      let pair = cache.get(pairKey)?.data as IAssetPair | undefined;

      if (!pair) {
        try {
          pair = await getAssetPair(toAssetId, fromAssetId);
        } catch (e) {
          console.log('trying to get USDT pair instead of USDC if toAssetId is USDC');
          // check if toAsset is USDC, if not, then currency setting is ETH and this won't make sense
          if (toAssetId === USDC) {
            if (fromAssetId === USDT) return Number(value);
            pair = await getAssetPair(USDT, fromAssetId);
          }
        } finally {
          pair = undefined;
        }
        mutate(pairKey, pair);
      }

      if (!pair) return 0;

      return Number(ethers.utils.formatUnits(pair.pairPrice, pair.baseDecimals)) * Number(value);
    },
    [cache, genAssetPairKey, getAssetPair, mutate]
  );

  useEffect(() => {
    (async () => {
      /* calc total debt */
      const _debts = await Promise.all(
        vaultPositions.map(async (position) =>
          position.isActive ? await convertValue(currencySettingAssetId, position.baseId, position.accruedArt_) : 0
        )
      );
      setTotalDebt(cleanValue(_debts.reduce((sum, debt) => sum + debt, 0).toFixed(), currencySettingDigits));

      /* calc total collateral */
      const _collateral = await Promise.all(
        vaultPositions.map(async (position) =>
          position.isActive ? await convertValue(currencySettingAssetId, position.ilkId, position.ink_) : 0
        )
      );
      setTotalCollateral(
        cleanValue(_collateral.reduce((sum, collateral) => sum + collateral, 0).toFixed(), currencySettingDigits)
      );
    })();
  }, [convertValue, currencySettingAssetId, vaultPositions]);

  useEffect(() => {
    (async () => {
      /* calc total lending */
      const _lendBalances = await Promise.all(
        lendPositions.map(
          async (position) => await convertValue(currencySettingAssetId, position.baseId, position.currentValue_!)
        )
      );
      setTotalLendBalance(
        cleanValue(_lendBalances.reduce((sum, lent) => sum + lent, 0).toFixed(), currencySettingDigits)
      );
    })();
  }, [convertValue, currencySettingAssetId, lendPositions]);

  useEffect(() => {
    (async () => {
      /* calc total strategies */
      const _strategyBalances = await Promise.all(
        strategyPositions.map(
          async (position) => await convertValue(currencySettingAssetId, position.baseId, position.currentValue_!)
        )
      );
      setTotalStrategyBalance(
        cleanValue(_strategyBalances.reduce((sum, val) => sum + val, 0).toString(), currencySettingDigits)
      );
    })();
  }, [convertValue, currencySettingAssetId, strategyPositions]);

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

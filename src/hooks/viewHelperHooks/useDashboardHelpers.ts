import { ethers } from 'ethers';
import { useCallback, useContext, useEffect, useState } from 'react';
import { sellFYToken, strategyTokenValue } from '@yield-protocol/ui-math';

import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { IPriceContext, ISeries, IStrategy, IStrategyDynamic, IVault } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import { USDC, WETH } from '../../config/assets';
import { ZERO_BN } from '../../utils/constants';
import { PriceContext } from '../../contexts/PriceContext';
import useTimeTillMaturity from '../useTimeTillMaturity';
import useStrategies from '../useStrategies';
import useStrategy from '../useStrategy';
import { useSWRConfig } from 'swr';
import useVaults from '../useVaults';
import useSeriesEntity from '../useSeriesEntity';

interface ILendPosition extends ISeries {
  currentValue_: string | undefined;
}

interface IStrategyPosition extends IStrategy {
  currentValue_: string | undefined;
}

export const useDashboardHelpers = (seriesMap: Map<string, ISeries>) => {
  const { cache, mutate } = useSWRConfig();

  /* STATE FROM CONTEXT */
  const {
    settingsState: { dashHideEmptyVaults, dashHideInactiveVaults, dashCurrency },
  } = useContext(SettingsContext);

  const { data: vaults } = useVaults();

  const { priceState, priceActions } = useContext(PriceContext) as IPriceContext;

  const { getTimeTillMaturity } = useTimeTillMaturity();
  const { data: strategyMap } = useStrategies();
  const { getStrategy, genKey } = useStrategy();
  const { getCurrentValue } = useSeriesEntity();

  const { pairMap } = priceState;
  const { updateAssetPair } = priceActions;

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
    if (!vaults) return;

    const _vaultPositions = Array.from(vaults.values())
      .filter((vault) => (dashHideInactiveVaults ? vault.isActive : true))
      .filter((vault) =>
        dashHideEmptyVaults ? vault.ink.value.gt(ZERO_BN) || vault.accruedArt.value.gt(ZERO_BN) : true
      )
      .filter((vault) => vault.baseId !== vault.ilkId)
      .sort((vaultA, vaultB) => (vaultA.art.value.lt(vaultB.art.value) ? 1 : -1));
    setVaultPositions(_vaultPositions);
  }, [dashHideInactiveVaults, dashHideEmptyVaults, vaults]);

  /* set lend positions */
  useEffect(() => {
    const lendPositions = Array.from(seriesMap.values()).map((_series) => {
      return { ..._series, currentValue_: _series.fyTokenBalance?.formatted || '0' } as ILendPosition;
    });

    setLendPositions(lendPositions);
  }, [getTimeTillMaturity, seriesMap]);

  /* set strategy positions */
  useEffect(() => {
    (async () => {
      if (!strategyMap) return;

      const _strategyPositions: IStrategyPosition[] = await Promise.all(
        Array.from(strategyMap.values()).map(async (s) => {
          let strategy: IStrategyDynamic | undefined;

          // check if swr has strategy
          const swrKey = genKey(s.address);
          const cachedStrategy = cache.get(swrKey) as IStrategyDynamic | undefined;

          if (cachedStrategy) {
            strategy = cachedStrategy;
          } else {
            strategy = await getStrategy(s.address);
            // mutate (update) swr with the strategy if not in cache
            mutate(swrKey, strategy);
          }

          // const { currentSeries: series } = strategy;

          // const [fyTokenToShares, sharesReceived] = strategyTokenValue(
          //   strategy.accountBalance.value,
          //   strategy.totalSupply.value,
          //   strategy.strategyPoolBalance.value,
          //   series.sharesReserves,
          //   series.fyTokenReserves,
          //   series.totalSupply,
          //   getTimeTillMaturity(series.maturity),
          //   series.ts,
          //   series.g2,
          //   series.decimals,
          //   series.c,
          //   series.mu
          // );

          // const currentValue_ = fyTokenToShares.gt(ethers.constants.Zero) // if we can sell all fyToken to shares
          //   ? ethers.utils.formatUnits(
          //       series.getBase(fyTokenToShares).add(series?.getBase(sharesReceived))!, // add shares received to fyTokenToShares (in base)
          //       series.decimals
          //     )
          //   : strategy.accountBalance.formatted; // if we can't sell all fyToken, just use account strategy token balance (rough estimate of current value)

          return { ...strategy, currentValue_: '0' };
        })
      );

      const filtered = _strategyPositions
        .filter((strategy) => strategy.accountBalance?.value.gt(ZERO_BN))
        .sort((_strategyA, _strategyB) =>
          _strategyA.accountBalance?.value.lt(_strategyB.accountBalance?.value!) ? 1 : -1
        );
      setStrategyPositions(filtered);
    })();
  }, [cache, genKey, getStrategy, getTimeTillMaturity, mutate, strategyMap]);

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

  /* get pairInfo */
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
    assetsUsedList.forEach(async (asset: string) => {
      !pairMap.has(USDC + asset) && updateAssetPair(USDC, asset);
      !pairMap.has(WETH + asset) && updateAssetPair(WETH, asset);
    });
  }, [lendPositions, strategyPositions, vaultPositions]);

  /* everytime the pairmap changes, get the  new values / totals */
  useEffect(() => {
    /* calc total debt */
    const _debts = vaultPositions.map((position) =>
      pairMap.has(currencySettingAssetId + position.baseId) && position.isActive
        ? convertValue(currencySettingAssetId, position.baseId, position.accruedArt.formatted)
        : 0
    );
    setTotalDebt(cleanValue(_debts.reduce((sum, debt) => sum + debt, 0).toFixed(), currencySettingDigits));

    /* calc total collateral */
    const _collateral = vaultPositions.map((position) =>
      pairMap.has(currencySettingAssetId + position.ilkId) && position.isActive
        ? convertValue(currencySettingAssetId, position.ilkId, position.ink.formatted)
        : 0
    );
    setTotalCollateral(
      cleanValue(_collateral.reduce((sum, collateral) => sum + collateral, 0).toFixed(), currencySettingDigits)
    );

    /* calc total collateral */
    const _lendBalances = lendPositions.map((position) =>
      pairMap.has(currencySettingAssetId + position.baseId)
        ? convertValue(currencySettingAssetId, position.baseId, position.currentValue_!)
        : 0
    );
    setTotalLendBalance(
      cleanValue(_lendBalances.reduce((sum, lent) => sum + lent, 0).toFixed(), currencySettingDigits)
    );

    /* calc total collateral */
    const _strategyBalances = strategyPositions.map((position) =>
      pairMap.has(currencySettingAssetId + position.baseId)
        ? convertValue(currencySettingAssetId, position.baseId, position.currentValue_!)
        : 0
    );
    setTotalStrategyBalance(
      cleanValue(_strategyBalances.reduce((sum, loaned) => sum + loaned, 0).toString(), currencySettingDigits)
    );
  }, [convertValue, currencySettingAssetId, lendPositions, pairMap, strategyPositions, vaultPositions]);

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

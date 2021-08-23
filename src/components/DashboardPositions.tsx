import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Box, Text } from 'grommet';
import { ethers } from 'ethers';

import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries, IUserContext, IVault } from '../types';
import { ZERO_BN, DAI, WETH, USDC, ONE_BN } from '../utils/constants';
import { cleanValue } from '../utils/appUtils';
import DashboardPosition from './DashboardPosition';
import DashboardPositionSummary from './DashboardPositionSummary';

interface IPositionItem {
  actionType: ActionType;
  positions: (ISeries | IVault)[];
}

const DashboardPositions = ({ actionType }: { actionType: ActionType }) => {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { seriesMap, vaultMap, showInactiveVaults, hideBalancesSetting, priceMap, currencySetting } = userState;

  const [vaultPositions, setVaultPositions] = useState<IVault[]>([]);
  const [lendPositions, setLendPositions] = useState<ISeries[]>([]);
  const [poolPositions, setPoolPositions] = useState<ISeries[]>([]);
  const [allPositions, setAllPositions] = useState<IPositionItem[]>([]);
  const [filterEmpty, setFilterEmpty] = useState<boolean>(true);
  const [totalDebt, setTotalDebt] = useState<string | null>(null);
  const [totalCollateral, setTotalCollateral] = useState<string | null>(null);
  const [totalLendBalance, setTotalLendBalance] = useState<string | null>(null);
  const [totalPoolBalance, setTotalPoolBalance] = useState<string | null>(null);
  const currencySettingAssetId = currencySetting === 'ETH' ? WETH : DAI;
  const currencySettingDigits = currencySetting === 'ETH' ? 6 : 2;

  useEffect(() => {
    const _vaultPositions: IVault[] = Array.from(vaultMap.values())
      .filter((vault: IVault) => showInactiveVaults || vault.isActive)
      .filter((vault: IVault) => filterEmpty && (vault.ink.gt(ZERO_BN) || vault.art.gt(ZERO_BN)));
    // .filter((vault: IVault) => hideBalancesSetting && vault.ink?.gt(ethers.utils.parseEther(hideBalancesSetting)));
    setVaultPositions(_vaultPositions);

    // calculate total debt in usd
    // set total debt in state
    // calculate total collateral in usd
    // set total collateral in state
  }, [vaultMap, actionType, showInactiveVaults, filterEmpty, hideBalancesSetting]);

  useEffect(() => {
    const _lendPositions: ISeries[] = Array.from(seriesMap.values())
      .filter((_series: ISeries) =>
        actionType === ActionType.LEND && _series ? _series.fyTokenBalance?.gt(ZERO_BN) : true
      )
      .filter((_series: ISeries) =>
        hideBalancesSetting ? Number(_series.fyTokenBalance_!) > Number(hideBalancesSetting) : true
      );
    setLendPositions(_lendPositions);

    const _poolPositions: ISeries[] = Array.from(seriesMap.values())
      .filter((_series: ISeries) =>
        actionType === ActionType.POOL && _series ? _series.poolTokens?.gt(ZERO_BN) : true
      )
      .filter((_series: ISeries) =>
        hideBalancesSetting ? Number(_series.poolTokens_!) > Number(hideBalancesSetting) : true
      );
    setPoolPositions(_poolPositions);
  }, [seriesMap, actionType, hideBalancesSetting]);

  useEffect(() => {
    setAllPositions([
      { actionType: ActionType.BORROW, positions: vaultPositions },
      { actionType: ActionType.LEND, positions: lendPositions },
      { actionType: ActionType.POOL, positions: poolPositions },
    ]);
  }, [vaultPositions, lendPositions, poolPositions]);

  // calculate position and vault balances
  useEffect(() => {
    // const getDebtInCurrency = allPositions.reduce()
  }, []);

  /* get the position's ink or art in dai or eth (input the asset id): value can be art, ink, fyToken, or pooToken balances */
  const getPositionValue = useCallback(
    (baseOrIlkId: string, value: string, assetId = DAI) => {
      let positionValue;

      if (assetId === WETH && baseOrIlkId !== WETH) {
        // calculate DAIWETH price
        const daiWethPrice = priceMap?.get(DAI)?.get(WETH);

        const daiWethPrice_ = ethers.utils.formatEther(daiWethPrice);
        // calculate WETHDAI price for 'ETH' currency setting
        const wethDaiPrice = 1 / Number(daiWethPrice_);
        positionValue = Number(wethDaiPrice) * Number(value);
      } else {
        const assetPrice = baseOrIlkId !== assetId && priceMap?.get(assetId)?.get(baseOrIlkId);
        const assetPrice_ = assetPrice ? ethers.utils.formatEther(assetPrice) : '1';
        positionValue = Number(assetPrice_) * Number(value);
      }
      return positionValue;
    },
    [priceMap]
  );

  /* get vault position total debt and collateral */
  useEffect(() => {
    const _debts = vaultPositions?.map((vault: IVault) =>
      getPositionValue(vault.baseId, vault.art_, currencySettingAssetId)
    );
    setTotalDebt(
      cleanValue(_debts.reduce((sum: number, debt: number) => sum + debt, 0).toString(), currencySettingDigits)
    );

    const _collaterals = vaultPositions?.map((vault: IVault) =>
      getPositionValue(vault.ilkId, vault.ink_, currencySettingAssetId)
    );
    console.log(_collaterals);
    setTotalCollateral(
      cleanValue(_collaterals.reduce((sum: number, debt: number) => sum + debt, 0).toString(), currencySettingDigits)
    );
  }, [priceMap, vaultPositions, currencySettingAssetId, getPositionValue, currencySettingDigits]);

  /* get series positions' total balances */
  useEffect(() => {
    const _lendBalances = lendPositions?.map((series: ISeries) =>
      getPositionValue(series.baseId, series.fyTokenBalance_!, currencySettingAssetId)
    );
    setTotalLendBalance(
      cleanValue(_lendBalances.reduce((sum: number, debt: number) => sum + debt, 0).toString(), currencySettingDigits)
    );

    const _poolBalances = poolPositions?.map((series: ISeries) =>
      getPositionValue(series.baseId, series.poolTokens_!, currencySettingAssetId)
    );
    setTotalPoolBalance(
      cleanValue(_poolBalances.reduce((sum: number, debt: number) => sum + debt, 0).toString(), currencySettingDigits)
    );
  }, [priceMap, lendPositions, poolPositions, currencySettingAssetId, getPositionValue, currencySettingDigits]);

  return (
    <DashboardPositionSummary
      debt={totalDebt!}
      collateral={totalCollateral!}
      lendBalance={totalLendBalance!}
      poolBalance={totalPoolBalance!}
      actionType={actionType}
    >
      {allPositions.map((item: IPositionItem) => (
        <Box key={item.actionType}>
          {actionType === item.actionType && item.positions.length === 0 && (
            <Text weight={450} size="small">
              No suggested positions
            </Text>
          )}

          {actionType === item.actionType &&
            item.positions.map((seriesOrVault: ISeries | IVault, i: number) => (
              <DashboardPosition
                seriesOrVault={seriesOrVault}
                index={i}
                actionType={actionType}
                key={seriesOrVault.id}
              />
            ))}
        </Box>
      ))}
    </DashboardPositionSummary>
  );
};

export default DashboardPositions;

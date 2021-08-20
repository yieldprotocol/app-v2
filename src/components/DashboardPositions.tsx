import React, { useContext, useEffect, useState } from 'react';
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

  /* get the vault's ink or art in dai: value can be art, ink, fyToken, or pooToken balances */
  const getValueInDai = (baseOrIlkId: string, value: string) => {
    const daiPrice = baseOrIlkId !== DAI && priceMap?.get(DAI)?.get(baseOrIlkId);
    const daiPrice_ = daiPrice ? ethers.utils.formatEther(daiPrice) : '1';
    return Number(daiPrice_) * Number(value);
  };

  /* get vault position total debt and collateral */
  useEffect(() => {
    if (currencySetting === 'ETH') {
      // get ether values
      const _debts = vaultPositions?.map((vault: IVault) => Number(ethers.utils.formatEther(vault.art)));
      setTotalDebt(cleanValue(_debts.reduce((sum: number, debt: number) => sum + debt, 0).toString(), 2));

      const _collaterals = vaultPositions?.map((vault: IVault) => Number(ethers.utils.formatEther(vault.art)));
      setTotalCollateral(cleanValue(_collaterals.reduce((sum: number, debt: number) => sum + debt, 0).toString(), 2));
    } else {
      const _debts = vaultPositions?.map((vault: IVault) => getValueInDai(vault.baseId, vault.art_));
      setTotalDebt(cleanValue(_debts.reduce((sum: number, debt: number) => sum + debt, 0).toString(), 2));

      const _collaterals = vaultPositions?.map((vault: IVault) => getValueInDai(vault.ilkId, vault.ink_));
      setTotalCollateral(cleanValue(_collaterals.reduce((sum: number, debt: number) => sum + debt, 0).toString(), 2));
    }
  }, [priceMap, vaultPositions, currencySetting]);

  /* get series positions' total balances */
  useEffect(() => {
    const _lendBalances = lendPositions?.map((series: ISeries) =>
      getValueInDai(series.baseId, series.fyTokenBalance_!)
    );
    setTotalLendBalance(cleanValue(_lendBalances.reduce((sum: number, debt: number) => sum + debt, 0).toString(), 2));

    const _poolBalances = poolPositions?.map((series: ISeries) => getValueInDai(series.baseId, series.poolTokens_!));
    setTotalPoolBalance(cleanValue(_poolBalances.reduce((sum: number, debt: number) => sum + debt, 0).toString(), 2));
  }, [priceMap, lendPositions, poolPositions]);

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

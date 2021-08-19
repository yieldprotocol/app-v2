import React, { useContext, useEffect, useState } from 'react';
import { Box, Text } from 'grommet';
import { ethers } from 'ethers';

import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries, IUserContext, IVault } from '../types';
import { ZERO_BN } from '../utils/constants';
import DashboardPosition from './DashboardPosition';

interface IPositionItem {
  actionType: ActionType;
  positions: (ISeries | IVault)[];
}

const DashboardPositions = ({ actionType }: { actionType: ActionType }) => {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { seriesMap, vaultMap, showInactiveVaults, hideBalancesSetting } = userState;

  const [vaultPositions, setVaultPositions] = useState<IVault[]>([]);
  const [lendPositions, setLendPositions] = useState<ISeries[]>([]);
  const [poolPositions, setPoolPositions] = useState<ISeries[]>([]);
  const [allPositions, setAllPositions] = useState<IPositionItem[]>([]);
  const [filterEmpty, setFilterEmpty] = useState<boolean>(true);

  useEffect(() => {
    const _vaultPositions: IVault[] = Array.from(vaultMap.values())
      .filter((vault: IVault) => showInactiveVaults || vault.isActive)
      .filter((vault: IVault) => filterEmpty && (vault.ink.gt(ZERO_BN) || vault.art.gt(ZERO_BN)));
    // .filter((vault: IVault) => hideBalancesSetting && vault.ink?.gt(ethers.utils.parseEther(hideBalancesSetting)));
    setVaultPositions(_vaultPositions);
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

  return (
    <>
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
    </>
  );
};

export default DashboardPositions;

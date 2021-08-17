import React, { useContext, useEffect, useState } from 'react';
import { Box, Text } from 'grommet';

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
  const { seriesMap, vaultMap } = userState;

  const [vaultPositions, setVaultPositions] = useState<IVault[]>([]);
  const [lendPositions, setLendPositions] = useState<ISeries[]>([]);
  const [poolPositions, setPoolPositions] = useState<ISeries[]>([]);
  const [allPositions, setAllPositions] = useState<IPositionItem[]>([]);
  const [filterEmpty, setFilterEmpty] = useState<boolean>(true);

  useEffect(() => {
    const _vaultPositions: IVault[] = Array.from(vaultMap.values())
      .filter((vault: IVault) => userState.showInactiveVaults || vault.isActive)
      .filter((vault: IVault) => filterEmpty && vault.ink.eq(ZERO_BN) && vault.art.eq(ZERO_BN));
    setVaultPositions(_vaultPositions);
  }, [vaultMap, actionType, userState.showInactiveVaults, filterEmpty]);

  useEffect(() => {
    const _lendPositions: ISeries[] = Array.from(seriesMap.values()).filter((_series: ISeries) =>
      actionType === ActionType.LEND && _series ? _series.fyTokenBalance?.gt(ZERO_BN) : true
    );
    setLendPositions(_lendPositions);

    const _poolPositions: ISeries[] = Array.from(seriesMap.values()).filter((_series: ISeries) =>
      actionType === ActionType.POOL && _series ? _series.poolTokens?.gt(ZERO_BN) : true
    );
    setPoolPositions(_poolPositions);
  }, [seriesMap, actionType]);

  useEffect(() => {
    setAllPositions([
      { actionType: ActionType.BORROW, positions: vaultPositions },
      { actionType: ActionType.LEND, positions: lendPositions },
      { actionType: ActionType.POOL, positions: poolPositions },
    ]);
  }, [vaultPositions, lendPositions, poolPositions]);

  return (
    <Box>
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
    </Box>
  );
};

export default DashboardPositions;

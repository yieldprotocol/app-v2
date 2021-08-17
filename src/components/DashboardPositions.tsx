import React, { useContext, useEffect, useState } from 'react';
import { Text } from 'grommet';

import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries, IUserContext, IVault } from '../types';
import { ZERO_BN } from '../utils/constants';
import DashboardPosition from './DashboardPosition';
import ListWrap from './wraps/ListWrap';

const DashboardPositions = ({ actionType }: { actionType: ActionType }) => {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { seriesMap, vaultMap } = userState;

  const [vaultPositions, setVaultPositions] = useState<IVault[]>([]);
  const [lendPositions, setLendPositions] = useState<ISeries[]>([]);
  const [poolPositions, setPoolPositions] = useState<ISeries[]>([]);

  useEffect(() => {
    const _vaultPositions: IVault[] = Array.from(vaultMap.values()).filter(
      (vault: IVault) => userState.showInactiveVaults || vault.isActive
    );
    setVaultPositions(_vaultPositions);
  }, [vaultMap, actionType, userState.showInactiveVaults]);

  useEffect(() => {
    const _lendPositions: ISeries[] = Array.from(seriesMap.values()).filter((_series: ISeries) =>
      actionType === 'LEND' && _series ? _series.fyTokenBalance?.gt(ZERO_BN) : true
    );

    setLendPositions(_lendPositions);

    const _poolPositions: ISeries[] = Array.from(seriesMap.values()).filter((_series: ISeries) =>
      actionType === 'POOL' && _series ? _series.poolTokens?.gt(ZERO_BN) : true
    );

    setPoolPositions(_poolPositions);
  }, [seriesMap, actionType]);

  return (
    <ListWrap>
      <>
        {actionType === ActionType.BORROW && vaultPositions.length === 0 ? (
          <Text weight={450} size="small">
            No suggested positions
          </Text>
        ) : (
          vaultPositions.map((vault, i) => (
            <DashboardPosition seriesOrVault={vault} index={i} actionType={actionType} key={vault.id} />
          ))
        )}

        {actionType === ActionType.LEND && lendPositions.length === 0 ? (
          <Text weight={450} size="small">
            No suggested positions
          </Text>
        ) : (
          lendPositions.map((series, i) => (
            <DashboardPosition seriesOrVault={series} index={i} actionType={actionType} key={series.id} />
          ))
        )}

        {actionType === ActionType.POOL && poolPositions.length === 0 ? (
          <Text weight={450} size="small">
            No suggested positions
          </Text>
        ) : (
          poolPositions.map((series, i) => (
            <DashboardPosition seriesOrVault={series} index={i} actionType={actionType} key={series.id} />
          ))
        )}
      </>
    </ListWrap>
  );
};

export default DashboardPositions;

import React, { useContext, useEffect, useState } from 'react';
import { Box } from 'grommet';
import { ActionType, ISeries, IUserContext, IVault } from '../types';
import { UserContext } from '../contexts/UserContext';
import VaultItem from './positionItems/VaultItem';
import PositionItem from './positionItems/LendItem';

function DashboardPositionListItem({
  seriesOrVault,
  index,
  actionType,
}: {
  seriesOrVault: any;
  index: number;
  actionType: ActionType;
}) {
  const {
    userState: { vaultMap, seriesMap },
  } = useContext(UserContext) as IUserContext;
  const [vault, setVault] = useState<IVault>();
  const [series, setSeries] = useState<ISeries>();

  useEffect(() => {
    actionType === ActionType.BORROW
      ? setVault(vaultMap?.get(seriesOrVault.id))
      : setSeries(seriesMap?.get(seriesOrVault.id));
  }, [seriesOrVault, actionType, vaultMap, seriesMap]);

  return (
    <Box>
      {vault && <VaultItem vault={seriesOrVault!} index={index} condensed />}
      {series && <PositionItem series={seriesOrVault!} index={index} actionType={actionType} condensed />}
    </Box>
  );
}

export default DashboardPositionListItem;

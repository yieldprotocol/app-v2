import React, { useContext, useEffect, useState } from 'react';
import { ActionType, ISeries, IUserContext, IVault } from '../types';
import { UserContext } from '../contexts/UserContext';
import VaultListItem from './VaultListItem';
import PositionItem from './PositionItem';

function DashboardPosition({
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
    <>
      {vault && <VaultListItem vault={seriesOrVault!} condensed />}
      {series && <PositionItem series={seriesOrVault!} index={index} actionType={actionType} condensed />}
    </>
  );
}

export default DashboardPosition;

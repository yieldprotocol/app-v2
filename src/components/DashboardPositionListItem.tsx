import { useContext } from 'react';
import { Box } from 'grommet';
import { ActionType } from '../types';
import { UserContext } from '../contexts/UserContext';
import VaultItem from './positionItems/VaultItem';
import LendItem from './positionItems/LendItem';
import StrategyItem from './positionItems/StrategyItem';
import useVaultsVR from '../hooks/entities/useVaultsVR';

function DashboardPositionListItem({ item, index, actionType }: { item: any; index: number; actionType: ActionType }) {
  const {
    userState: { vaultMap, seriesMap, strategyMap },
  } = useContext(UserContext);

  const shouldShowLendPosition = (lendPosition: any) => {
    const isFRPosition = lendPosition?.maturity ? true : false;
    if (isFRPosition) {
      return seriesMap?.has(lendPosition?.id);
    } else {
      return lendPosition.hasOwnProperty('vyTokenBaseVal');
    }
  };

  return (
    <Box>
      {vaultMap?.has(item.id!) && <VaultItem vault={item!} index={index} condensed />}
      {shouldShowLendPosition(item) && <LendItem item={item!} index={index} condensed />}
      {strategyMap?.has(item.id) && <StrategyItem strategy={item!} index={index} condensed />}
    </Box>
  );
}

export default DashboardPositionListItem;

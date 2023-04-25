import { useContext } from 'react';
import { Box } from 'grommet';
import { ActionType } from '../types';
import { UserContext } from '../contexts/UserContext';
import VaultItem from './positionItems/VaultItem';
import LendItem from './positionItems/LendItem';
import StrategyItem from './positionItems/StrategyItem';

function DashboardPositionListItem({ item, index, actionType }: { item: any; index: number; actionType: ActionType }) {
  const {
    userState: { vaultMap, seriesMap, strategyMap },
  } = useContext(UserContext);

  return (
    <Box>
      {vaultMap?.has(item.id!) && <VaultItem vault={item!} index={index} condensed />}
      {seriesMap?.has(item.id) && <LendItem item={item!} index={index} condensed />}
      {strategyMap?.has(item.id) && <StrategyItem strategy={item!} index={index} condensed />}
    </Box>
  );
}

export default DashboardPositionListItem;

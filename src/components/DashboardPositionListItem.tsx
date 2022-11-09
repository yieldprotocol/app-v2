import { useContext } from 'react';
import { Box } from 'grommet';
import { ActionType } from '../types';
import { UserContext } from '../contexts/UserContext';
import VaultItem from './positionItems/VaultItem';
import LendItem from './positionItems/LendItem';
import StrategyItem from './positionItems/StrategyItem';
import useStrategies from '../hooks/useStrategies';

function DashboardPositionListItem({ item, index, actionType }: { item: any; index: number; actionType: ActionType }) {
  const {
    userState: { vaultMap, seriesMap },
  } = useContext(UserContext);

  const { data: strategyMap } = useStrategies();

  return (
    <Box>
      {vaultMap?.has(item.id!) && <VaultItem vault={item!} index={index} condensed />}
      {seriesMap?.has(item.id) && <LendItem series={item!} index={index} actionType={actionType} condensed />}
      {strategyMap?.has(item.id) && <StrategyItem strategy={item!} index={index} condensed />}
    </Box>
  );
}

export default DashboardPositionListItem;

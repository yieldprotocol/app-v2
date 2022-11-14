import { useContext } from 'react';
import { Box } from 'grommet';
import { ActionType } from '../types';
import { UserContext } from '../contexts/UserContext';
import VaultItem from './positionItems/VaultItem';
import LendItem from './positionItems/LendItem';
import StrategyItem from './positionItems/StrategyItem';
import useStrategies from '../hooks/useStrategies';
import useVaults from '../hooks/useVaults';

function DashboardPositionListItem({ item, index, actionType }: { item: any; index: number; actionType: ActionType }) {
  const {
    userState: { seriesMap },
  } = useContext(UserContext);
  const { data: vaults } = useVaults();
  const { data: strategyMap } = useStrategies();

  return (
    <Box>
      {vaults?.has(item.id!) && <VaultItem id={item.id!} index={index} condensed />}
      {seriesMap?.has(item.id) && <LendItem series={item!} index={index} actionType={actionType} condensed />}
      {strategyMap?.has(item.id) && <StrategyItem strategyAddress={item.address!} index={index} condensed />}
    </Box>
  );
}

export default DashboardPositionListItem;

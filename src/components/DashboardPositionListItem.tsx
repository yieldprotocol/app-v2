import { Box } from 'grommet';
import { ActionType } from '../types';
import VaultItem from './positionItems/VaultItem';
import LendItem from './positionItems/LendItem';
import StrategyItem from './positionItems/StrategyItem';
import useStrategies from '../hooks/useStrategies';
import useVaults from '../hooks/useVaults';
import useSeriesEntities from '../hooks/useSeriesEntities';

function DashboardPositionListItem({ item, index, actionType }: { item: any; index: number; actionType: ActionType }) {
  const { data: seriesMap } = useSeriesEntities();
  const { data: vaults } = useVaults();
  const { data: strategyMap } = useStrategies();

  return (
    <Box>
      {vaults?.has(item.id!) && <VaultItem id={item.id!} index={index} condensed />}
      {seriesMap?.has(item.id) && <LendItem seriesId={item.id!} index={index} actionType={actionType} condensed />}
      {strategyMap?.has(item.id) && <StrategyItem strategyAddress={item.address!} index={index} condensed />}
    </Box>
  );
}

export default DashboardPositionListItem;

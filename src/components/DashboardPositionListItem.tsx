import { Box } from 'grommet';
import { ActionType } from '../types';
import VaultItem from './positionItems/VaultItem';
import LendItem from './positionItems/LendItem';
import StrategyItem from './positionItems/StrategyItem';
import useSeriesEntity from '../hooks/useSeriesEntity';
import useVault from '../hooks/useVault';
import useStrategy from '../hooks/useStrategy';

function DashboardPositionListItem({ item, index, actionType }: { item: any; index: number; actionType: ActionType }) {
  const { data: seriesEntity } = useSeriesEntity(item.id);
  const { data: vault } = useVault(item.id);
  const { data: strategy } = useStrategy(item.id);

  return (
    <Box>
      {vault && <VaultItem id={item.id!} index={index} condensed />}
      {seriesEntity && <LendItem seriesId={item.id!} index={index} actionType={actionType} condensed />}
      {strategy && <StrategyItem strategyAddress={item.address!} index={index} condensed />}
    </Box>
  );
}

export default DashboardPositionListItem;

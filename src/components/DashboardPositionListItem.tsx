import { Box } from 'grommet';
import { ActionType, ISeries, IStrategy, IVault } from '../types';
import VaultItem from './positionItems/VaultItem';
import LendItem from './positionItems/LendItem';
import StrategyItem from './positionItems/StrategyItem';
import useSeriesEntity from '../hooks/useSeriesEntity';
import useVault from '../hooks/useVault';
import useStrategy from '../hooks/useStrategy';

function DashboardPositionListItem({
  item,
  index,
  actionType,
}: {
  item: IVault | ISeries | IStrategy;
  index: number;
  actionType: ActionType;
}) {
  const { data: seriesEntity } = useSeriesEntity(actionType === ActionType.LEND ? item.id : undefined);
  const { data: vault } = useVault(ActionType.BORROW ? item.id : undefined);
  const { data: strategy } = useStrategy(ActionType.POOL ? item.id : undefined);

  return (
    <Box>
      {vault && <VaultItem id={item.id!} index={index} condensed />}
      {seriesEntity && <LendItem seriesId={item.id!} index={index} actionType={actionType} condensed />}
      {strategy && <StrategyItem strategyAddress={item.id!} index={index} condensed />}
    </Box>
  );
}

export default DashboardPositionListItem;

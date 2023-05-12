import { useContext } from 'react';
import { Box } from 'grommet';
import { IVault } from '../types';
import { UserContext } from '../contexts/UserContext';
import VaultItem from './positionItems/VaultItem';
import LendItem from './positionItems/LendItem';
import StrategyItem from './positionItems/StrategyItem';
import useVYTokens from '../hooks/entities/useVYTokens';
import { ILendPosition, IStrategyPosition } from '../hooks/viewHelperHooks/useDashboardHelpers';

function DashboardPositionListItem({
  item,
  index,
}: {
  item: IVault | ILendPosition | IStrategyPosition;
  index: number;
}) {
  const {
    userState: { vaultMap, strategyMap, seriesMap },
  } = useContext(UserContext);

  const { data: vyTokens } = useVYTokens();

  const vault = vaultMap.get(item.id);
  const lendPosition = vyTokens?.has(item.id) ? vyTokens.get(item.id) : seriesMap.get(item.id);
  const strategy = strategyMap.get(item.id);

  return (
    <Box>
      {vault && <VaultItem vault={vault} index={index} condensed />}
      {lendPosition && <LendItem item={lendPosition} index={index} condensed />}
      {strategy && <StrategyItem strategy={strategy} index={index} condensed />}
    </Box>
  );
}

export default DashboardPositionListItem;

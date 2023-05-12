import { Box, Text } from 'grommet';
import styled from 'styled-components';

import { ActionType, ISeries, IStrategy, IVault } from '../types';
import DashboardPositionListItem from './DashboardPositionListItem';
import DashboardPositionSummary from './DashboardPositionSummary';
import { ILendPosition, IStrategyPosition } from '../hooks/viewHelperHooks/useDashboardHelpers';

const StyledBox = styled(Box)`
  max-height: 1000px;
`;

interface IDashPosition {
  debt?: string | null;
  collateral?: string | null;
  lendBalance?: string | null;
  strategyBalance?: string | null;
  actionType: ActionType;
  positions: (IVault | ILendPosition | IStrategyPosition)[];
  showList: boolean;
}

const DashboardPositionList = ({
  debt,
  collateral,
  lendBalance,
  strategyBalance,
  positions,
  actionType,
  showList,
}: IDashPosition) => (
  <DashboardPositionSummary
    debt={debt!}
    collateral={collateral!}
    lendBalance={lendBalance!}
    strategyBalance={strategyBalance!}
    actionType={actionType}
    showList={showList}
  >
    <StyledBox gap="small" pad="medium">
      {positions.length === 0 && (
        <Text weight={450} size="small">
          No suggested positions
        </Text>
      )}
      {positions.map((position, i) => (
        <DashboardPositionListItem item={position} index={i} key={position.id} />
      ))}
    </StyledBox>
  </DashboardPositionSummary>
);

DashboardPositionList.defaultProps = {
  debt: null,
  collateral: null,
  lendBalance: null,
  strategyBalance: null,
};

export default DashboardPositionList;

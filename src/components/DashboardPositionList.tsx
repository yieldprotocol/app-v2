import React from 'react';
import { Box, Text } from 'grommet';

import { ActionType, ISeries, IStrategy, IVault } from '../types';
import DashboardPositionListItem from './DashboardPositionListItem';
import DashboardPositionSummary from './DashboardPositionSummary';

interface IDashPosition {
  debt?: string | null;
  collateral?: string | null;
  lendBalance?: string | null;
  strategyBalance?: string | null;
  actionType: ActionType;
  positions: (ISeries | IVault | IStrategy)[];
}

const DashboardPositionList = ({
  debt,
  collateral,
  lendBalance,
  strategyBalance,
  positions,
  actionType,
}: IDashPosition) => (
  <DashboardPositionSummary
    debt={debt!}
    collateral={collateral!}
    lendBalance={lendBalance!}
    strategyBalance={strategyBalance!}
  >
    <Box>
      {positions.length === 0 && (
        <Text weight={450} size="small">
          No suggested positions
        </Text>
      )}
      {positions.map((position: ISeries | IVault | IStrategy, i: number) => (
        <DashboardPositionListItem item={position} index={i} actionType={actionType} key={position.id} />
      ))}
    </Box>
  </DashboardPositionSummary>
);

DashboardPositionList.defaultProps = { debt: null, collateral: null, lendBalance: null, strategyBalance: null };

export default DashboardPositionList;

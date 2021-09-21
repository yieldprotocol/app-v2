import React from 'react';
import { Box, Text } from 'grommet';
import DashboardSettings from './DashboardSettings';
import { ActionType } from '../types';

interface IDashSummary {
  debt: string | null;
  collateral: string | null;
  lendBalance: string | null;
  strategyBalance: string | null;
  actionType: string;
  children: any;
}

const Summary = ({ label, value }: { label: string; value: string }) => (
  <Box gap="small" direction="row" align="center">
    <Text size="small">{label}:</Text>
    <Text color="tailwind-blue">{value}</Text>
  </Box>
);

const DashboardPositionSummary = ({
  debt,
  collateral,
  lendBalance,
  strategyBalance,
  actionType,
  children,
}: IDashSummary) => (
  <Box>
    <Box direction="row" justify="between" background="tailwind-blue-50" round="xsmall" pad="small">
      <Box direction="row" gap="small">
        {debt && <Summary label="Debt" value={debt} />}
        {collateral && <Summary label="Collateral" value={collateral} />}
        {lendBalance && <Summary label="Balance" value={lendBalance} />}
        {strategyBalance && <Summary label="Balance" value={strategyBalance} />}
      </Box>
      {actionType === ActionType.BORROW && <DashboardSettings actionType={actionType} />}
    </Box>
    <Box pad={{ vertical: 'xsmall', horizontal: 'none' }}>{children}</Box>
  </Box>
);

export default DashboardPositionSummary;

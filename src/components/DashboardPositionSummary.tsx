import React from 'react';
import { Box, Text } from 'grommet';
import ListWrap from './wraps/ListWrap';

interface IDashSummary {
  debt: string | null;
  collateral: string | null;
  lendBalance: string | null;
  strategyBalance: string | null;
  children: any;
}

const Summary = ({ label, value }: { label: string; value: string }) => (
  <Box gap="small" direction="row" align="center">
    <Text size="small">{label}:</Text>
    <Text color="tailwind-blue">{value}</Text>
  </Box>
);

const DashboardPositionSummary = ({ debt, collateral, lendBalance, strategyBalance, children }: IDashSummary) => (
  <Box>
    <Box direction="row" justify="between" background="tailwind-blue-50" round="xsmall" pad="small">
      <Box direction="row" gap="small">
        {debt && <Summary label="Debt" value={debt} />}
        {collateral && <Summary label="Collateral" value={collateral} />}
        {lendBalance && <Summary label="Balance" value={lendBalance} />}
        {strategyBalance && <Summary label="Balance" value={strategyBalance} />}
      </Box>
    </Box>
    <Box pad={{ vertical: 'xsmall', horizontal: 'none' }}>{children}</Box>
  </Box>
);

export default DashboardPositionSummary;

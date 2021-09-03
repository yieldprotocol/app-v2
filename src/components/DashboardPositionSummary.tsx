import React from 'react';
import { Box, Text } from 'grommet';
import ListWrap from './wraps/ListWrap';

interface IDashSummary {
  debt: string | null;
  collateral: string | null;
  lendBalance: string | null;
  poolBalance: string | null;
  children: any;
}

const Summary = ({ label, value }: { label: string; value: string }) => (
  <Box gap="small" direction="row" align="center">
    <Text size="small">{label}:</Text>
    <Text color="tailwind-blue">{value}</Text>
  </Box>
);

const DashboardPositionSummary = ({ debt, collateral, lendBalance, poolBalance, children }: IDashSummary) => (
  <Box>
    <Box direction="row" justify="between" background="tailwind-blue-50" round="xsmall" pad="small">
      <Box direction="row" gap="small">
        {debt && <Summary label="Debt" value={debt} />}
        {collateral && <Summary label="Collateral" value={collateral} />}
        {lendBalance && <Summary label="Balance" value={lendBalance} />}
        {poolBalance && <Summary label="Balance" value={poolBalance} />}
      </Box>
    </Box>
    <ListWrap pad={{ vertical: 'xsmall', horizontal: 'none' }}>{children}</ListWrap>
  </Box>
);

export default DashboardPositionSummary;

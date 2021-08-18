import React from 'react';
import { Box, Text } from 'grommet';

interface IDashboardBalance {
  debt: string;
  collateral: string;
  netWorth: string;
}

const DashboardBalances = ({ debt, collateral, netWorth }: IDashboardBalance) => (
  <Box gap="medium">
    <Box gap="medium">
      <Box direction="row" gap="small" align="center">
        <Text size="small">Total Debt:</Text>
        <Text>{debt}</Text>
      </Box>
      <Box direction="row" gap="small" align="center">
        <Text size="small">Total Collateral:</Text>
        <Text>{collateral}</Text>
      </Box>
      <Box direction="row" gap="small" align="center">
        <Text size="small">Net Worth</Text>
        <Text>{netWorth}</Text>
      </Box>
    </Box>
  </Box>
);

export default DashboardBalances;

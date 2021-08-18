import React from 'react';
import { Box, Text } from 'grommet';

const DashboardBalances = () => (
  <Box gap="medium">
    <Box gap="medium">
      <Box direction="row" gap="small" align="center">
        <Text size="small">Total Debt:</Text>
        <Text>$something</Text>
      </Box>
      <Box direction="row" gap="small" align="center">
        <Text size="small">Total Collateral:</Text>
        <Text>$something</Text>
      </Box>
      <Box direction="row" gap="small" align="center">
        <Text size="small">Net Worth</Text>
        <Text>$something</Text>
      </Box>
    </Box>
  </Box>
);

export default DashboardBalances;

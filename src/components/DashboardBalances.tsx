import React from 'react';
import { Box, Text } from 'grommet';
import { FiPlus, FiMinus } from 'react-icons/fi';

interface IDashboardBalance {
  debt: string;
  collateral: string;
  positionBalance: string;
}

const DashboardBalances = ({ debt, collateral, positionBalance }: IDashboardBalance) => (
  <Box gap="medium">
    <Box gap="xxsmall" pad="xsmall" border={{ side: 'bottom' }}>
      <Box gap="xxsmall">
        <Box direction="row" gap="small" align="center">
          <Text size="small">Total Position Balance:</Text>
          <Text>${positionBalance}</Text>
        </Box>
        <FiPlus color="green" />
      </Box>
      <Box gap="xsmall">
        <Box direction="row" gap="small" align="center">
          <Text size="small">Total Collateral:</Text>
          <Text>${collateral}</Text>
        </Box>
        <FiMinus color="red" />
      </Box>
      <Box gap="xsmall">
        <Box direction="row" gap="small" align="center">
          <Text size="small">Total Debt:</Text>
          <Text>${debt}</Text>
        </Box>
      </Box>
    </Box>
    <Box direction="row" gap="small" align="center">
      <Text size="medium">Net Worth</Text>
      <Text size="medium">${Number(collateral) - Number(debt) + Number(positionBalance)}</Text>
    </Box>
  </Box>
);

export default DashboardBalances;

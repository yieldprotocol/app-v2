import React from 'react';
import { Box, Text } from 'grommet';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { cleanValue } from '../utils/appUtils';

interface IDashboardBalance {
  debt: string;
  collateral: string;
  positionBalance: string;
  digits?: number;
}

const DashboardBalanceSummary = ({ debt, collateral, positionBalance, digits }: IDashboardBalance) => (
  <Box gap="medium">
    <Box gap="xxsmall" border={{ side: 'bottom' }}>
      <Box gap="xxsmall">
        <Box direction="row" justify="between">
          <Text size="xsmall">Total Position Balance:</Text>
          <Text size="small">${positionBalance}</Text>
        </Box>
        <FiPlus color="#34D399" />
      </Box>
      <Box gap="xsmall">
        <Box direction="row" justify="between">
          <Text size="xsmall">Total Collateral:</Text>
          <Text size="small">${collateral}</Text>
        </Box>
        <FiMinus color="#F87171" />
      </Box>
      <Box gap="xsmall">
        <Box direction="row" justify="between">
          <Text size="xsmall">Total Debt:</Text>
          <Text size="small">${debt}</Text>
        </Box>
      </Box>
    </Box>
    <Box direction="row" justify="between">
      <Text size="small">Net Worth</Text>
      <Text size="medium">
        ${cleanValue((Number(collateral) - Number(debt) + Number(positionBalance)).toString(), digits)}
      </Text>
    </Box>
  </Box>
);
DashboardBalanceSummary.defaultProps = { digits: 2 };

export default DashboardBalanceSummary;

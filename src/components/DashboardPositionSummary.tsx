import React, { useState } from 'react';
import { Box, Collapsible, Text } from 'grommet';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

const DashboardPositionSummary = ({ debt, collateral, balance, children }: any) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <Box onClick={() => setOpen(!open)} border={{ color: 'tailwind-blue' }} round="xsmall" pad="small">
      <Box direction="row" justify="between" align="center">
        <Box direction="row" gap="small">
          {debt && <Text>Debt: {debt}</Text>}
          {collateral && <Text>Collateral: {collateral}</Text>}
          {/* {balance && <Text>Balance: {balance}</Text>} */}
        </Box>
        <Box>
          {open ? (
            <Box color="tailwind-blue">
              <FiChevronUp />
            </Box>
          ) : (
            <FiChevronDown />
          )}
        </Box>
      </Box>
      <Collapsible open={open}>{children}</Collapsible>
    </Box>
  );
};

DashboardPositionSummary.defaultProps = { debt: '100', collateral: '100', balance: '100' };

export default DashboardPositionSummary;

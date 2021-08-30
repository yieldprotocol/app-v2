import React, { useState } from 'react';
import { Box, Collapsible, Text } from 'grommet';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
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

const DashboardPositionSummary = ({ debt, collateral, lendBalance, poolBalance, children }: IDashSummary) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <Box>
      <Box direction="row" justify="between" background="tailwind-blue-50" round="xsmall" pad="small">
        <Box direction="row" gap="small">
          {debt && <Summary label="Debt" value={debt} />}
          {collateral && <Summary label="Collateral" value={collateral} />}
          {lendBalance && <Summary label="Balance" value={lendBalance} />}
          {poolBalance && <Summary label="Balance" value={poolBalance} />}
        </Box>
      </Box>
      <Box onClick={() => setOpen(!open)} direction="row" justify="between" round="xsmall" pad="small">
        <Text size="small">{open ? 'Select Position' : 'View All Positions'}</Text>
        <Box justify="center">
          {open ? (
            <Box color="tailwind-blue">
              <FiChevronUp />
            </Box>
          ) : (
            <FiChevronDown />
          )}
        </Box>
      </Box>
      <Collapsible open={open}>
        <ListWrap pad={{ vertical:'medium', horizontal:'medium' }} >{children}</ListWrap>
      </Collapsible>
    </Box>
  );
};

export default DashboardPositionSummary;

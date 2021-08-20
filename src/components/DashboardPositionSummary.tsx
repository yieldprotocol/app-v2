import React, { useState } from 'react';
import { Box, Collapsible, Text } from 'grommet';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { ActionType } from '../types';
import PositionAvatar from './PositionAvatar';

interface IDashSummary {
  debt: string;
  collateral: string;
  lendBalance: string;
  poolBalance: string;
  actionType: ActionType;
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
  poolBalance,
  actionType,
  children,
}: IDashSummary) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Box onClick={() => setOpen(!open)} border={{ color: 'tailwind-blue' }} round="xsmall" pad="small">
      <Box direction="row" justify="between" align="center">
        <Box direction="row" gap="small">
          {actionType === ActionType.BORROW && <Summary label="Debt" value={debt} />}
          {actionType === ActionType.BORROW && <Summary label="Collateral" value={collateral} />}
          {actionType === ActionType.LEND && <Summary label="Balance" value={lendBalance} />}
          {actionType === ActionType.POOL && <Summary label="Balance" value={poolBalance} />}
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

export default DashboardPositionSummary;

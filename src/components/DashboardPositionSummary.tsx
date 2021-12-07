import React from 'react';
import { Box, Text } from 'grommet';
import DashboardSettings from './DashboardSettings';
import { ActionType } from '../types';
import SkeletonWrap from './wraps/SkeletonWrap';

interface IDashSummary {
  debt: string | null;
  collateral: string | null;
  lendBalance: string | null;
  strategyBalance: string | null;
  actionType: string;
  dashPricesLoading: boolean;
  children: any;
}

const Summary = ({ label, value, loading }: { label: string; value: string; loading: boolean }) => (
  <Box gap="small" direction="row" align="center">
    <Text size="small">{label}:</Text>
    <Text color={label === 'Debt' ? '#EF4444' : 'brand'}>{loading ? <SkeletonWrap /> : value}</Text>
  </Box>
);

const DashboardPositionSummary = ({
  debt,
  collateral,
  lendBalance,
  strategyBalance,
  actionType,
  dashPricesLoading,
  children,
}: IDashSummary) => (
  <Box>
    <Box direction="row" justify="between" background="gradient-transparent" round="xsmall" pad="small">
      <Box direction="row-responsive" gap="small">
        {debt && <Summary label="Debt" value={debt} loading={dashPricesLoading} />}
        {collateral && <Summary label="Collateral" value={collateral} loading={dashPricesLoading} />}
        {lendBalance && <Summary label="Balance" value={lendBalance} loading={dashPricesLoading} />}
        {strategyBalance && <Summary label="Balance" value={strategyBalance} loading={dashPricesLoading} />}
      </Box>
      {actionType === ActionType.BORROW && <DashboardSettings actionType={actionType} />}
    </Box>
    <Box pad={{ vertical: 'xsmall', horizontal: 'none' }}>{children}</Box>
  </Box>
);

export default DashboardPositionSummary;

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
  children: any;
  showList: boolean;
}

const Summary = ({ label, value }: { label: string; value: string | null }) => (
  <Box gap="small" direction="row" align="center">
    <Text size="small">{label}:</Text>
    <Text color={label === 'Debt' ? '#EF4444' : 'brand'}>{value || <SkeletonWrap />}</Text>
  </Box>
);

const DashboardPositionSummary = ({
  debt,
  collateral,
  lendBalance,
  strategyBalance,
  actionType,
  children,
  showList,
}: IDashSummary) => (
  <Box>
    <Box direction="row" justify="between" background="gradient-transparent" round="xsmall" pad="small">
      <Box direction="row-responsive" gap="small">
        {actionType === ActionType.BORROW && <Summary label="Debt" value={debt!} />}
        {actionType === ActionType.BORROW && <Summary label="Collateral" value={collateral!} />}
        {actionType === ActionType.LEND && <Summary label="Balance" value={lendBalance!} />}
        {actionType === ActionType.POOL && <Summary label="Approximate Balance" value={strategyBalance!} />}
      </Box>
      {actionType === ActionType.BORROW && <DashboardSettings actionType={actionType} />}
    </Box>
    {showList && <Box pad={{ vertical: 'xsmall', horizontal: 'none' }}>{children}</Box>}
  </Box>
);

export default DashboardPositionSummary;

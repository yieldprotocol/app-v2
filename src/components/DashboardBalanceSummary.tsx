import React from 'react';
import { Box, Text } from 'grommet';
import Skeleton from 'react-loading-skeleton';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { cleanValue } from '../utils/appUtils';

interface IDashboardBalance {
  debt: string;
  collateral: string;
  lendBalance: string;
  poolBalance: string;
  digits?: number;
  loading?: boolean;
  symbol?: string;
}

const DashboardBalanceSummary = ({
  debt,
  collateral,
  lendBalance,
  poolBalance,
  digits,
  loading,
  symbol,
}: IDashboardBalance) => (
  <Box gap="medium">
    <Box gap="xxsmall" border={{ side: 'bottom' }}>
      <Box gap="xxsmall">
        <Box direction="row" justify="between">
          <Text size="xsmall">Total Lent:</Text>
          {loading ? (
            <Skeleton width={50} />
          ) : (
            <Text size="small">
              {symbol}
              {cleanValue(lendBalance, digits)}
            </Text>
          )}
        </Box>
        <FiPlus color="#34D399" />
        <Box direction="row" justify="between">
          <Text size="xsmall">Total Pooled:</Text>
          {loading ? (
            <Skeleton width={50} />
          ) : (
            <Text size="small">
              {symbol}
              {cleanValue(poolBalance, digits)}
            </Text>
          )}
        </Box>
        <FiPlus color="#34D399" />
      </Box>
      <Box gap="xsmall">
        <Box direction="row" justify="between">
          <Text size="xsmall">Total Collateral:</Text>
          {loading ? (
            <Skeleton width={50} />
          ) : (
            <Text size="small">
              {symbol}
              {cleanValue(collateral, digits)}
            </Text>
          )}
        </Box>
        <FiMinus color="#F87171" />
      </Box>
      <Box gap="xsmall">
        <Box direction="row" justify="between">
          <Text size="xsmall">Total Debt:</Text>
          {loading ? (
            <Skeleton width={50} />
          ) : (
            <Text size="small">
              {symbol}
              {cleanValue(debt, digits)}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
    <Box direction="row" justify="between">
      <Text size="small">Total:</Text>
      {loading ? (
        <Skeleton width={50} />
      ) : (
        <Text size="medium">
          {symbol}
          {cleanValue(
            (Number(collateral) - Number(debt) + Number(lendBalance) + Number(poolBalance)).toString(),
            digits
          )}
        </Text>
      )}
    </Box>
  </Box>
);
DashboardBalanceSummary.defaultProps = { digits: 2, loading: false, symbol: '$' };

export default DashboardBalanceSummary;

import React, { useContext, useEffect, useState } from 'react';
import { Box, Text } from 'grommet';
import { FiPlus, FiMinus } from 'react-icons/fi';
import Skeleton from './wraps/SkeletonWrap';
import { formatValue } from '../utils/appUtils';
import { UserContext } from '../contexts/UserContext';

interface IDashboardBalance {
  debt: string;
  collateral: string;
  lendBalance: string;
  poolBalance: string;
  digits?: number;
  symbol?: string;
}

const DashboardBalanceSummary = ({ debt, collateral, lendBalance, poolBalance, digits, symbol }: IDashboardBalance) => {
  const {
    userState: { vaultsLoading, seriesLoading, pricesLoading, strategiesLoading },
  } = useContext(UserContext);

  const [totalBalance, setTotalBalance] = useState<number>();

  useEffect(() => {
    setTotalBalance(Number(collateral) - Number(debt) + Number(lendBalance) + Number(poolBalance));
  }, [collateral, debt, lendBalance, poolBalance]);

  return (
    <Box gap="medium">
      <Box gap="xxsmall" border={{ side: 'bottom' }}>
        <Box gap="xxsmall">
          <Box direction="row" justify="between">
            <Text size="xsmall">Total Lent:</Text>
            {seriesLoading ? (
              <Skeleton width={50} />
            ) : (
              <Text size="small">
                {symbol}
                {formatValue(lendBalance, digits!)}
              </Text>
            )}
          </Box>
          <FiPlus color="#34D399" />
          <Box direction="row" justify="between">
            <Text size="xsmall">Total Pooled:</Text>
            {strategiesLoading ? (
              <Skeleton width={50} />
            ) : (
              <Text size="small">
                {symbol}
                {formatValue(poolBalance, digits!)}
              </Text>
            )}
          </Box>
          <FiPlus color="#34D399" />
        </Box>
        <Box gap="xsmall">
          <Box direction="row" justify="between">
            <Text size="xsmall">Total Collateral:</Text>
            {vaultsLoading || pricesLoading ? (
              <Skeleton width={50} />
            ) : (
              <Text size="small">
                {symbol}
                {formatValue(collateral, digits!)}
              </Text>
            )}
          </Box>
          <FiMinus color="#F87171" />
        </Box>
        <Box gap="xsmall">
          <Box direction="row" justify="between">
            <Text size="xsmall">Total Debt:</Text>
            {vaultsLoading || pricesLoading ? (
              <Skeleton width={50} />
            ) : (
              <Text size="small">
                {symbol}
                {formatValue(debt, digits!)}
              </Text>
            )}
          </Box>
        </Box>
      </Box>
      <Box direction="row" justify="between">
        <Text size="small">Total:</Text>
        {vaultsLoading || seriesLoading || strategiesLoading || (pricesLoading && !totalBalance) ? (
          <Skeleton width={50} />
        ) : (
          <Text size="medium">
            {symbol}
            {formatValue(totalBalance!, digits!)}
          </Text>
        )}
      </Box>
    </Box>
  );
};

DashboardBalanceSummary.defaultProps = { digits: 2, symbol: '$' };

export default DashboardBalanceSummary;

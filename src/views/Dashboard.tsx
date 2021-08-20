import React, { useContext, useState } from 'react';
import { Box, ResponsiveContext, Text } from 'grommet';
import Skeleton from 'react-loading-skeleton';
import { ChainContext } from '../contexts/ChainContext';
import DashboardPositions from '../components/DashboardPositions';
import { ActionType } from '../types';
import YieldInfo from '../components/YieldInfo';
import DashboardBalances from '../components/DashboardBalances';
import MainViewWrap from '../components/wraps/MainViewWrap';
import PanelWrap from '../components/wraps/PanelWrap';
import { UserContext } from '../contexts/UserContext';
import HideBalancesSetting from '../components/HideBalancesSetting';

const Dashboard = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  /* STATE FROM CONTEXT */
  const {
    chainState: { account, chainLoading },
  } = useContext(ChainContext);

  const {
    userState: { vaultsLoading, seriesLoading },
  } = useContext(UserContext);

  return (
    <MainViewWrap>
      {!mobile && (
        <PanelWrap align="end">
          <Box margin={{ top: '35%' }} gap="medium">
            {/* <DashboardBalances debt="10" collateral="100" positionBalance="10" /> */}
            <HideBalancesSetting width="30%" />
          </Box>
          <YieldInfo />
        </PanelWrap>
      )}
      <Box fill pad="large" margin={{ top: 'xlarge' }}>
        {!account && !chainLoading && <Text>Please connect to your account</Text>}
        {account && (
          <Box width={mobile ? undefined : '500px'} gap="medium">
            <Box gap="medium">
              <Text size="medium">Vaults</Text>
              {vaultsLoading ? (
                <Skeleton width={mobile ? 300 : 600} count={1} height={40} />
              ) : (
                <DashboardPositions actionType={ActionType.BORROW} />
              )}
            </Box>
            <Box gap="medium">
              <Text size="medium">Lend Positions</Text>
              {seriesLoading ? (
                <Skeleton width={mobile ? 300 : 600} count={1} height={40} />
              ) : (
                <DashboardPositions actionType={ActionType.LEND} />
              )}
            </Box>
            <Box gap="medium">
              <Text size="medium">Pool Positions</Text>
              {seriesLoading ? (
                <Skeleton width={mobile ? 300 : 600} count={1} height={40} />
              ) : (
                <DashboardPositions actionType={ActionType.POOL} />
              )}
            </Box>
          </Box>
        )}
      </Box>
    </MainViewWrap>
  );
};
export default Dashboard;

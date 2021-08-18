import React, { useContext, useState } from 'react';
import { Box, ResponsiveContext, Text } from 'grommet';
import { ChainContext } from '../contexts/ChainContext';
import DashboardPositions from '../components/DashboardPositions';
import { ActionType } from '../types';
import YieldInfo from '../components/YieldInfo';
import DashboardBalances from '../components/DashboardBalances';
import MainViewWrap from '../components/wraps/MainViewWrap';
import PanelWrap from '../components/wraps/PanelWrap';
import { UserContext } from '../contexts/UserContext';

const Dashboard = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  /* STATE FROM CONTEXT */
  const {
    chainState: { account, chainLoading },
  } = useContext(ChainContext);

  const {
    userState: { userLoading, vaultsLoading, seriesLoading },
  } = useContext(UserContext);

  /* LOCAL STATE */
  // const positionTypes = ['All Positions', 'Vaults', 'Lend Positions', 'Pool Positions'];
  // const [view, setView] = useState<string>('All Positions');

  // const viewTypeRender = (
  //   <Box gap="medium">
  //     {positionTypes.map((type) => (
  //       <Box key={type} onClick={() => setView(type)}>
  //         {type === view ? <StyledText>{type}</StyledText> : <Text>{type}</Text>}
  //       </Box>
  //     ))}
  //   </Box>
  // );

  return (
    <MainViewWrap>
      {!mobile && (
        <PanelWrap align="end">
          <Box margin={{ top: '35%' }} gap="medium">
            {/* {viewTypeRender} */}
            <DashboardBalances debt="$nice" collateral="$nice" netWorth="$nice" />
          </Box>
          <YieldInfo />
        </PanelWrap>
      )}
      <Box fill pad="large" margin={{ top: 'xlarge' }}>
        {!account && !chainLoading && <Text>Please connect to your account</Text>}
        {account && (
          <Box width="70%" gap="medium">
            <Box gap="medium">
              <Text size="medium">Vaults</Text>
              {vaultsLoading ? <Text>Loading...</Text> : <DashboardPositions actionType={ActionType.BORROW} />}
            </Box>
            <Box gap="medium">
              <Text size="medium">Lend Positions</Text>
              {seriesLoading ? <Text>Loading...</Text> : <DashboardPositions actionType={ActionType.LEND} />}
            </Box>
            <Box gap="medium">
              <Text size="medium">Pool Positions</Text>
              {seriesLoading ? <Text>Loading...</Text> : <DashboardPositions actionType={ActionType.POOL} />}
            </Box>
          </Box>
        )}
      </Box>
    </MainViewWrap>
  );
};
export default Dashboard;

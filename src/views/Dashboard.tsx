import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { Box, ResponsiveContext, Text } from 'grommet';
import { ChainContext } from '../contexts/ChainContext';
import DashboardPositions from '../components/DashboardPositions';
import { ActionType } from '../types';
import YieldInfo from '../components/YieldInfo';
import MainViewWrap from '../components/wraps/MainViewWrap';
import PanelWrap from '../components/wraps/PanelWrap';
import { StyledText } from '../components/StepperText';
import ListWrap from '../components/wraps/ListWrap';

const Dashboard = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  /* STATE FROM CONTEXT */
  const {
    chainState: { account },
  } = useContext(ChainContext);

  /* LOCAL STATE */
  const positionTypes = ['All Positions', 'Vaults', 'Lend Positions', 'Pool Positions'];
  const [view, setView] = useState<string>('All Positions');

  const viewTypeRender = (
    <Box gap="medium">
      {positionTypes.map((type) => (
        <Box key={type} onClick={() => setView(type)}>
          {type === view ? <StyledText>{type}</StyledText> : <Text>{type}</Text>}
        </Box>
      ))}
    </Box>
  );

  return (
    <MainViewWrap>
      {!mobile && (
        <PanelWrap align="end">
          <Box margin={{ top: '35%' }} gap="medium">
            {viewTypeRender}
          </Box>
          <YieldInfo />
        </PanelWrap>
      )}
      <Box fill pad="large" margin={{ top: 'xlarge' }}>
        {!account && <Text>Please connect to your account</Text>}
        {account && (
          <Box width="70%" gap="medium">
            <Box gap="medium">
              <Text size="medium">Vaults</Text>
              <DashboardPositions actionType={ActionType.BORROW} />
            </Box>
            <Box gap="medium">
              <Text size="medium">Lend Positions</Text>
              <DashboardPositions actionType={ActionType.LEND} />
            </Box>
            <Box gap="medium">
              <Text size="medium">Pool Positions</Text>
              <DashboardPositions actionType={ActionType.POOL} />
            </Box>
          </Box>
        )}
      </Box>
    </MainViewWrap>
  );
};
export default Dashboard;

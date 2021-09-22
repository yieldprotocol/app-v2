import React, { useContext, useState, useRef } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import { Box, Header, Grid, ResponsiveContext, Avatar } from 'grommet';

import YieldNavigation from './YieldNavigation';
import YieldAccount from './YieldAccount';
import YieldMark from './logos/YieldMark';

import { useCachedState } from '../hooks/generalHooks';
import BackButton from './buttons/BackButton';

interface IYieldHeaderProps {
  actionList: any[];
}
const YieldHeader = ({ actionList }: IYieldHeaderProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const history = useHistory();
  const prevLoc = useCachedState('lastVisit', '')[0].slice(1).split('/')[0];
  const isPositionPath = useLocation().pathname.includes('position');

  return (
    <>
      <Header
        pad={mobile ? 'medium' : 'large'}
        height={mobile ? undefined : 'xsmall'}
        style={{ position: 'fixed', top: '0px' }}
        direction="row"
        fill="horizontal"
        background="white"
        elevation={mobile && isPositionPath ? 'small' : undefined}
      >
        <Grid columns={['auto', '1fr', 'auto']} fill="horizontal">
          <Box direction="row" gap="large" align="center">
            {mobile && !isPositionPath && (
              <Box onClick={actionList[0]}>
                <FiMenu size="1.5rem" />
              </Box>
            )}
            {mobile && isPositionPath && <BackButton action={() => history.goBack()} />}
            {!mobile && (
              <>
                <Avatar background="hover" size="3rem">
                  <NavLink to={`/${prevLoc}`} style={{ height: '50%' }}>
                    <YieldMark
                      height="1.75rem"
                      colors={['#f79533', '#f37055', '#ef4e7b', '#a166ab', '#5073b8', '#1098ad', '#07b39b', '#6fba82']}
                    />
                  </NavLink>
                </Avatar>
                <YieldNavigation />
              </>
            )}
          </Box>
          <Box />

          <Box align="end">
            <YieldAccount />
          </Box>
        </Grid>
      </Header>
    </>
  );
};

export default YieldHeader;

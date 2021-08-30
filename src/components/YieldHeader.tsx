import React, { useContext, useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Header, Grid, ResponsiveContext, Avatar } from 'grommet';

import YieldNavigation from './YieldNavigation';
import YieldAccount from './YieldAccount';
import YieldMark from './logos/YieldMark';

import { useCachedState } from '../hooks/generalHooks';

interface IYieldHeaderProps {
  actionList: any[];
}
const YieldHeader = ({ actionList }: IYieldHeaderProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const prevLoc = useCachedState('lastVisit', '')[0].slice(1).split('/')[0];

  return (
    <>
      {!mobile && (
        <Header
          pad={mobile ? 'xsmall' : 'large'}
          height={mobile ? undefined : 'xsmall'}
          style={{ position: 'fixed', top: '0px' }}
          background="background"
          direction="row"
          fill="horizontal"
        >
          <Grid columns={['auto', '1fr', 'auto']} fill="horizontal">
            <Box direction="row" gap={mobile ? '0.25em' : 'medium'} align="center">
              <Avatar>
                <NavLink to={`/${prevLoc}`}>
                  <YieldMark height={mobile ? '1.0em' : '2em'} />
                </NavLink>
              </Avatar>
              {!mobile && <YieldNavigation />}
            </Box>
            <Box />

            <Box align="end">
              <YieldAccount />
            </Box>
          </Grid>
        </Header>
      )}
    </>
  );
};

export default YieldHeader;

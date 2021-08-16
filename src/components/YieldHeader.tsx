import React, { useContext, useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Collapsible, Header, Grid, Layer, ResponsiveContext, Text, Avatar } from 'grommet';

import { FiMenu, FiToggleRight, FiToggleLeft } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import YieldLogo from './logos/YieldLogo';

import YieldNavigation from './YieldNavigation';
import YieldAccount from './YieldAccount';
import YieldMark from './logos/YieldMark';
import HandText from './texts/HandText';
import { useCachedState } from '../hooks/generalHooks';

interface IYieldHeaderProps {
  actionList: any[];
}
const YieldHeader = ({ actionList }: IYieldHeaderProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const prevLoc = useCachedState('lastVisit', '')[0].slice(1).split('/')[0];

  return (
    <Header
      pad="large"
      height={mobile ? undefined : 'xsmall'}
      style={{ position: 'fixed', top: '0px' }}
      background="background"
      direction="row"
      fill="horizontal"
    >
      <Grid columns={['flex', 'flex', 'medium']} fill="horizontal">
        <Box direction="row" gap={mobile ? '0.25em' : 'medium'} align="center">
          <Avatar>
            <NavLink to={`/${prevLoc}`}>
              <YieldMark height={mobile ? '1.0em' : '2em'} />
            </NavLink>
          </Avatar>
          {!mobile && <YieldNavigation />}
        </Box>
        {/* <YieldLogo height={mobile ? '1em' : '1.5em'} /> */}
        <Box />

        <Box align="end">
          <YieldAccount />
        </Box>
      </Grid>
    </Header>
  );
};

export default YieldHeader;

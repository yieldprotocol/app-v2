import { Box, Collapsible, Header, Grid, Layer, ResponsiveContext, Text, Avatar } from 'grommet';
import React, { useContext, useState, useRef } from 'react';

import { FiMenu, FiToggleRight, FiToggleLeft } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import YieldLogo from './logos/YieldLogo';

import YieldNavigation from './YieldNavigation';
import YieldAccount from './YieldAccount';
import YieldMark from './logos/YieldMark';
import HandText from './texts/HandText';

interface IYieldHeaderProps {
  actionList: any[];
}
const YieldHeader = ({ actionList }: IYieldHeaderProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

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
            <YieldMark height={mobile ? '1.0em' : '2em'} />
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

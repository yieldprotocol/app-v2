import { Box, Collapsible, Header, Layer, ResponsiveContext, Text } from 'grommet';
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
      justify="between"
      fill="horizontal"
      style={{ position: 'fixed', top: '0px' }}
      background="background"
    >
      <Box direction="row" gap={mobile ? '0.25em' : '0.5em'} align="center">
        {/* <YieldMark height={mobile ? '1.0em' : '1.5em'}/>
        <HandText size={mobile ? '1.5em' : '2em'} >YIELD</HandText> */}
        <YieldLogo height={mobile ? '1.0em' : '1.5em'} />
      </Box>
      {/* <YieldLogo height={mobile ? '1em' : '1.5em'} /> */}

      {!mobile && <YieldNavigation />}

      <YieldAccount />
    </Header>
  );
};

export default YieldHeader;

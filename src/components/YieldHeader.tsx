import { Box, Collapsible, Header, Layer, ResponsiveContext, Text } from 'grommet';
import React, { useContext, useState, useRef } from 'react';

import { FiMenu, FiX } from 'react-icons/fi';

import YieldNavigation from './YieldNavigation';

interface IYieldHeaderProps {
  actionList: any[];
}
const YieldHeader = ({ actionList } : IYieldHeaderProps) => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const [toggleMenu] = actionList;

  return (

    <Header
      pad="medium"
      height={mobile ? undefined : 'xsmall'}
      justify="between"
      fill="horizontal"
      style={{ position: 'fixed', top: '0px' }}
      background="background"
    >
      <Box background="brand" pad={mobile ? 'xsmall' : 'small'}>
        <Text size={mobile ? 'xsmall' : undefined}> YIELD</Text>
      </Box>

      { !mobile && <YieldNavigation /> }

      <Box border={!mobile} onClick={() => toggleMenu()} pad="small">
        <Text size="small" color="text"> { mobile ? <FiMenu /> : 'Account and vaults'} </Text>
      </Box>

    </Header>

  );
};

export default YieldHeader;

import { Box, Collapsible, Header, Layer, ResponsiveContext, Text } from 'grommet';
import React, { useContext, useState, useRef } from 'react';

import { FiMenu, FiToggleRight, FiToggleLeft } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import YieldLogo from './logos/YieldLogo';

import YieldNavigation from './YieldNavigation';
import YieldAccount from './YieldAccount';

interface IYieldHeaderProps {
  actionList: any[];
}
const YieldHeader = ({ actionList }: IYieldHeaderProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Header
      pad="medium"
      height={mobile ? undefined : 'xsmall'}
      justify="between"
      fill="horizontal"
      style={{ position: 'fixed', top: '0px' }}
      background="background"
    >
      <YieldLogo height={mobile ? '1em' : '2em'} />

      {!mobile && <YieldNavigation />}

      <YieldAccount />
    </Header>
  );
};

export default YieldHeader;

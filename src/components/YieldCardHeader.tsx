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
  logo?: boolean;
  children: any;
}

const YieldCardHeader = ({ logo, children }: IYieldHeaderProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box 
      direction="row" 
      align="center" 
      margin={mobile ? { bottom: 'large' } : { bottom: 'small' }} 
      justify="between"
    >
      <Box direction="row" gap="large" align="center">
        {logo && <YieldMark height="1.5em" />}
        {children}
      </Box>
      {mobile && <FiMenu />}
    </Box>
  );
};

YieldCardHeader.defaultProps = { logo: false };

export default YieldCardHeader;

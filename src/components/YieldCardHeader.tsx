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
import { ISeries } from '../types';

interface IYieldHeaderProps {
  logo?: boolean;
  series?: ISeries | undefined;
  children: any;
}

const YieldCardHeader = ({ logo, series, children }: IYieldHeaderProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box
      // margin={mobile ? { bottom: 'large' } : { bottom: 'small' }}
      background="background"
      // style={mobile? { position:'fixed', top: '0px' }: {}}
    >
      <Box pad={mobile ? { bottom: 'large' } : { bottom: 'small' }} direction="row" align="center" justify="between">
        <Box direction="row" gap="large" align="center">
          {logo && (
            <Avatar size="2.5rem">
              <YieldMark startColor={series?.startColor} endColor={series?.endColor} height="1.75rem" />
            </Avatar>
          )}
          {children}
        </Box>
        {mobile && <FiMenu />}
      </Box>
    </Box>
  );
};

YieldCardHeader.defaultProps = { logo: false, series: undefined };

export default YieldCardHeader;

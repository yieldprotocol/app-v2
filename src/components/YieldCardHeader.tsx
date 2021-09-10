import React, { useContext } from 'react';
import { Box, ResponsiveContext, Avatar } from 'grommet';

import { FiMenu } from 'react-icons/fi';

import YieldMark from './logos/YieldMark';
import { ISeries } from '../types';

interface IYieldHeaderProps {
  logo?: boolean;
  series?: ISeries | undefined;
  children: any;
}

const YieldCardHeader = ({ logo, series, children }: IYieldHeaderProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box>
      <Box pad={mobile ? { bottom: 'large' } : { bottom: 'small' }} direction="row" align="center" justify="between">
        <Box direction="row" gap="large" align="center">
          {logo && (
            <Avatar size="2.5rem">
              <YieldMark colors={[series?.startColor!, series?.endColor!] } height="2rem" />
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

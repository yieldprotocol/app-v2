import React from 'react';
import { Box, Text } from 'grommet';
import Skeleton from './wraps/SkeletonWrap';

interface IInfoBite {
  label: string;
  value: string;
  icon?: any;
  loading?: boolean;
}

const InfoBite = ({ label, value, icon, loading }: IInfoBite) => (
  <Box direction="row" align="center" pad={{ left: 'small', vertical: 'none' }} gap="medium">
    {icon && <Box>{icon}</Box>}
    <Box>
      <Text size="xsmall" color="text-weak">
        {label}
      </Text>
      <Text size="medium"> {loading ? <Skeleton width={80} height={20} /> : value} </Text>
    </Box>
  </Box>
);

InfoBite.defaultProps = { icon: undefined, loading: false };

export default InfoBite;

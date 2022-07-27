import { FC } from 'react';
import { Box, Text } from 'grommet';
import Skeleton from './wraps/SkeletonWrap';

interface IInfoBite {
  label: string;
  value: string;
  icon?: any;
  loading?: boolean;
}

const InfoBite: FC<IInfoBite> = ({ label, value, icon, loading, children }) => (
  <Box direction="row" align="center" pad={{ left: 'small', vertical: 'none' }} gap="medium">
    {icon && <Box>{icon}</Box>}
    <Box>
      <Text size="xsmall" color="text" weight="lighter">
        {label}
      </Text>
      <Box direction="row" gap="xsmall">
        <Text size="small">{loading ? <Skeleton width={80} height={20} /> : value}</Text>
        {children}
      </Box>
    </Box>
  </Box>
);

InfoBite.defaultProps = { icon: undefined, loading: false };

export default InfoBite;

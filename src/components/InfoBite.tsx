import { FC } from 'react';
import { Box, Text, Tip } from 'grommet';
import { FiInfo } from 'react-icons/fi';
import Skeleton from './wraps/SkeletonWrap';

interface IInfoBite {
  label: string;
  value: string;
  icon?: any;
  loading?: boolean;
  labelInfo?: string;
}

const InfoBite: FC<IInfoBite> = ({ label, value, icon, loading, labelInfo, children }) => (
  <Box direction="row" align="center" pad={{ left: 'small', vertical: 'none' }} gap="medium">
    {icon && <Box>{icon}</Box>}
    <Box>
      {labelInfo ? (
        <Tip
          plain
          content={
            <Box
              background="background"
              border={{ color: 'gradient-transparent' }}
              pad="small"
              elevation="small"
              round="small"
              margin={{ vertical: 'xxsmall' }}
            >
              <Text size="xsmall">{labelInfo}</Text>
            </Box>
          }
          dropProps={{
            align: { left: 'right', bottom: 'top' },
          }}
        >
          <Box direction="row" gap="xxsmall">
            <Text size="xsmall" color="text" weight="lighter">
              {label}
            </Text>
            {labelInfo && <FiInfo size={12} />}
          </Box>
        </Tip>
      ) : (
        <Text size="xsmall" color="text" weight="lighter">
          {label}
        </Text>
      )}

      <Box direction="row" gap="xsmall">
        <Text size="small">{loading ? <Skeleton width={80} height={20} /> : value}</Text>
        {children}
      </Box>
    </Box>
  </Box>
);

InfoBite.defaultProps = { icon: undefined, loading: false };

export default InfoBite;

import { ReactNode } from 'react';
import { Box, Text, Tip } from 'grommet';
import { FiInfo } from 'react-icons/fi';
import Skeleton from './wraps/SkeletonWrap';

interface IInfoBite {
  label: string;
  value: string;
  icon?: any;
  loading?: boolean;
  labelInfo?: string | ReactNode;
  textSize?: string;
  children?: ReactNode;
}

const InfoBite = ({ label, value, icon, loading, labelInfo, textSize, children }: IInfoBite) => (
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
              flex="grow"
            >
              <Text size="xsmall">{labelInfo}</Text>
            </Box>
          }
          dropProps={{
            align: { left: 'right', bottom: 'top' },
          }}
        >
          <Box direction="row" gap="xxsmall">
            <Text size={'xsmall'} color="text" weight="lighter">
              {label}
            </Text>
            {labelInfo && <FiInfo size={12} />}
          </Box>
        </Tip>
      ) : (
        <Text size={textSize || 'xsmall'} color="text" weight="lighter">
          {label}
        </Text>
      )}

      <Box direction="row" gap="xsmall">
        <Text size={textSize || 'small'}>{loading ? <Skeleton width={80} height={20} /> : value}</Text>
        {children}
      </Box>
    </Box>
  </Box>
);

InfoBite.defaultProps = { icon: undefined, loading: false };

export default InfoBite;

import { useContext } from 'react';
import { Box, ResponsiveContext } from 'grommet';

interface IYieldHeaderProps {
  children: any;
}

const YieldCardHeader = ({ children }: IYieldHeaderProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box
      pad={mobile ? { bottom: 'medium', top: 'medium' } : { bottom: 'small' }}
      direction="row"
      align="center"
      justify="between"
    >
      <Box direction="row" gap="large" align="center">
        {children}
      </Box>
    </Box>
  );
};

export default YieldCardHeader;

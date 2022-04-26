import { useContext } from 'react';
import { Box, BoxTypes, ResponsiveContext } from 'grommet';

interface IMainViewWrapProps extends BoxTypes {
  children: React.ReactNode;
}

const MainViewWrap = ({ children, background }: IMainViewWrapProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  return mobile ? (
    <Box>{children}</Box>
  ) : (
    <Box
      direction="row"
      fill
      justify="between"
      gap="small"
      width={background ? undefined : { max: '1500px' }}
      alignSelf="center"
      background={background}
    >
      {children}
    </Box>
  );
};

export default MainViewWrap;

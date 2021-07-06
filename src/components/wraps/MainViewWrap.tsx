import React, { useContext } from 'react';
import { Box, BoxTypes, ResponsiveContext } from 'grommet';

interface IMainViewWrapProps extends BoxTypes {
  children:React.ReactNode;
}

const MainViewWrap = ({ children, background }: IMainViewWrapProps) => {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');

  return (
    mobile ? (
      <Box
        fill
        alignSelf="center"
        // gap="large"
        pad="medium"
        height={{ min: '500px' }}
        direction="column-reverse"
      >
        {children}
      </Box>)
      :
      <Box
        direction="row-responsive"
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

// MainViewWrap.defaultProps = { fullWidth: false };

export default MainViewWrap;

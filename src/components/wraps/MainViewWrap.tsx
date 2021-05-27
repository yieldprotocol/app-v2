import React, { useContext } from 'react';
import { Box, ResponsiveContext } from 'grommet';

interface IMainViewWrapProps {
  children:React.ReactNode;
}

const MainViewWrap = ({ children }: IMainViewWrapProps) => {
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
      >
        {children}
      </Box>
  );
};

// MainViewWrap.defaultProps = { fullWidth: false };

export default MainViewWrap;

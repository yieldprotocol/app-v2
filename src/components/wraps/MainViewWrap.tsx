import React, { useContext } from 'react';
import { Box, ResponsiveContext } from 'grommet';

interface IMainViewWrapProps {
  children:React.ReactNode;
  fullWidth?:boolean;
}

const MainViewWrap = ({ fullWidth, children }: IMainViewWrapProps) => {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');

  return (
    mobile ? (
      <Box
        fill
        alignSelf="center"
        gap="large"
        pad="medium"
        height={{ min: '500px' }}
      >
        { children }
      </Box>)
      :
      <Box
        fill={fullWidth ? true : 'vertical'}
        alignSelf="center"
        gap="large"
        pad="medium"
        width={fullWidth ? undefined : { max: '500px', min: '500px' }}
      >
        { children }
      </Box>
  );
};

MainViewWrap.defaultProps = { fullWidth: false };

export default MainViewWrap;

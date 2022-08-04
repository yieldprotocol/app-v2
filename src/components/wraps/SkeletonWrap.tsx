import React, { useContext } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { ThemeContext } from 'styled-components';

const SkeletonWrap = ({ ...props }: any) => {
  const theme = useContext(ThemeContext);
  return (
    <SkeletonTheme baseColor={theme.dark ? '#202A30' : undefined} highlightColor={theme.dark ? '#313c42' : undefined}>
      <Skeleton width={50} {...props} />
    </SkeletonTheme>
  );
};

export default SkeletonWrap;

import React, { useContext } from 'react';
import { Box, BoxTypes, Heading, ResponsiveContext, Text } from 'grommet';
import { BorderType } from 'grommet/utils';

interface IPanelWrap extends BoxTypes {
  basis?: string;
  right?: boolean;
  children: any;
}

function PanelWrap({ background, basis, right, children }: IPanelWrap) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  return (
    <Box
      basis={basis || '33%'}
      fill
      align={right ? 'end' : 'start'}
      pad="large"
      justify="between"
      background={background}
      width="400px"
    >
      {children}
    </Box>
  );
}

PanelWrap.defaultProps = { basis: undefined, right: false };
export default PanelWrap;

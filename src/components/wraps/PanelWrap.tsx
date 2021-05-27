import React, { useContext } from 'react';
import { Box, Heading, ResponsiveContext, Text } from 'grommet';
import { BorderType } from 'grommet/utils';

interface IPanelWrap {
  basis?: string
  children: any;
}
function PanelWrap({ basis, children }: IPanelWrap) {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  return (
    <Box basis={basis}>
      {children}
    </Box>
  );
}

PanelWrap.defaultProps = { basis: undefined };
export default PanelWrap;

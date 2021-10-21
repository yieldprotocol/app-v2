import React, { useContext } from 'react';
import { Box, Layer, ResponsiveContext } from 'grommet';

function ActionButtonWrap({ children, pad }: { children: any; pad?: boolean }) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return mobile ? (
    <Layer position="bottom" background="white" modal={false} responsive={false} full="horizontal" animate={false}>
      <Box gap="small" fill="horizontal" pad="small">
        {children}
      </Box>
    </Layer>
  ) : (
    <Box
      gap="small"
      fill="horizontal"
      pad={pad ? { horizontal: 'large', vertical: 'medium', bottom: 'large' } : undefined}
    >
      {children}
    </Box>
  );
}

ActionButtonWrap.defaultProps = { pad: false };

export default ActionButtonWrap;

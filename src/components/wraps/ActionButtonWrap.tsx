import React, { useContext } from 'react';
import { Button, Box, Text, Layer, ResponsiveContext } from 'grommet';
import { ChainContext } from '../../contexts/ChainContext';

function ActionButtonWrap({ children, pad }: { children: any; pad?: boolean }) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    chainState: { account },
    chainActions: { connect },
  } = useContext(ChainContext);

  return mobile ? (
    <Layer position="bottom" modal={false} responsive={false} full="horizontal" animate={false} background="#00000000">
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
      {account ? (
        children
      ) : (
        <Button
          secondary
          label={<Text size={mobile ? 'small' : undefined}> Connect Wallet </Text>}
          onClick={() => connect()}
          disabled
        />
      )}
    </Box>
  );
}

ActionButtonWrap.defaultProps = { pad: false };

export default ActionButtonWrap;

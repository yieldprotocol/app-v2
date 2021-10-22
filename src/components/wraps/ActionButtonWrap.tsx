import React, { useContext, useState } from 'react';
import { Button, Box, Text, Layer, ResponsiveContext } from 'grommet';
import { ChainContext } from '../../contexts/ChainContext';
import Connect from '../Connect';
import SidebarSettings from '../SidebarSettings';

function ActionButtonWrap({ children, pad }: { children: any; pad?: boolean }) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    chainState: {
      connection: { account },
    },
    chainActions: { connect },
  } = useContext(ChainContext);

  const [connectOpen, setConnectOpen] = useState<boolean>(false);

  return mobile ? (
    <Layer position="bottom" background="white" modal={false} responsive={false} full="horizontal" animate={false}>
      <Box gap="small" fill="horizontal" pad="small">
        {children}
      </Box>
    </Layer>
  ) : (
    <>
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
            label={<Text size={mobile ? 'small' : undefined}>Connect Wallet</Text>}
            onClick={() => setConnectOpen(true)}
          />
        )}
      </Box>
      {connectOpen && <SidebarSettings connectOpen={connectOpen} setConnectOpen={setConnectOpen} />}
    </>
  );
}

ActionButtonWrap.defaultProps = { pad: false };

export default ActionButtonWrap;

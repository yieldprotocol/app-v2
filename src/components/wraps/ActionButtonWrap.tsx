import React, { useContext } from 'react';
import { Button, Box, Text, Layer, ResponsiveContext } from 'grommet';
import { ChainContext } from '../../contexts/ChainContext';

function ActionButtonWrap({ ...props }: any) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    chainState: { account },
    chainActions: { connect },
  } = useContext(ChainContext);

  return mobile ? (
    <Layer position="bottom" modal={false} responsive={false} full="horizontal" animate={false}>
      <Box gap="small" fill="horizontal" pad="small">
        {props.children}
      </Box>
    </Layer>
  ) : (
    <Box gap="small" fill="horizontal">
      {account ? (
        props.children
      ) : (
        <Button
          secondary
          label={<Text size={mobile ? 'small' : undefined}> Connect Wallet </Text>}
          onClick={() => connect()}
        />
      )}
    </Box>
  );
}

export default ActionButtonWrap;

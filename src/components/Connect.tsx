import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, ResponsiveContext, Text } from 'grommet';
import { FiCheckSquare, FiX } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';
import BackButton from './buttons/BackButton';
import Disclaimer from './Disclaimer';
import { useCachedState } from '../hooks/generalHooks';

const Connect = ({ setSettingsOpen, setConnectOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    chainState: {
      connection: { account, activatingConnector, CONNECTORS, CONNECTOR_NAMES },
    },
    chainActions: { connect, isConnected },
  } = useContext(ChainContext);

  const [disclaimerChecked, setDisclaimerChecked] = useCachedState('disclaimerChecked', false);

  const handleConnect = (connectorName: string) => {
    console.log(connectorName)
    connect(connectorName);
    setConnectOpen(false);
  };

  return (
    <Box fill="vertical" basis="auto" width={mobile ? undefined : '400px'} pad="medium" gap="small" elevation="xlarge">
      <Box justify="between" align="center" direction="row">
        {account && CONNECTORS ? (
          <BackButton
            action={() => {
              setSettingsOpen(true);
              setConnectOpen(false);
            }}
          />
        ) : (
          <Text>Connect</Text>
        )}
        <Button icon={<FiX size="1.5rem" />} onClick={() => setConnectOpen(false)} plain />
      </Box>
      <Box gap="xsmall">
        {[...CONNECTORS.keys()].map((name: string) => {
          const currentConnector = CONNECTORS.get(name);
          const activating = currentConnector === activatingConnector;
          const connected = isConnected(name);

          return (
            <Button
              key={name}
              plain
              onClick={() => !connected && handleConnect(name)}
              disabled={!disclaimerChecked}
              primary={connected}
              secondary={!connected}
              style={{ border: '#2563EB solid 1px', borderRadius: '6px', padding: '12px' }}
              hoverIndicator={{ color: 'brand' }}
            >
              <Box direction="row" gap="xsmall">
                {connected && <FiCheckSquare color="#34D399" />}
                {activating ? 'Connecting' : CONNECTOR_NAMES.get(name)}
              </Box>
            </Button>
          );
        })}
      </Box>
      {!disclaimerChecked && (
        <Box border={{ color: 'brand' }} round="xsmall">
          <Disclaimer
            checked={disclaimerChecked}
            onChange={(event: any) => setDisclaimerChecked(event.target.checked)}
          />
        </Box>
      )}
    </Box>
  );
};

export default Connect;

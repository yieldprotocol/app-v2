import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Text } from 'grommet';
import { FiCheckSquare, FiX } from 'react-icons/fi';
import { ChainContext, connectorNames } from '../contexts/ChainContext';
import BackButton from './buttons/BackButton';

const Connect = ({ setSettingsOpen, setConnectOpen }: any) => {
  const {
    chainState: { account, connector, connectors },
    chainActions: { connect, disconnect },
  } = useContext(ChainContext);

  const [activatingConnector, setActivatingConnector] = useState<any>();

  /* Handle logic to recognize the connector currently being activated */
  useEffect(() => {
    activatingConnector && activatingConnector === connector && setActivatingConnector(undefined);
  }, [activatingConnector, connector]);

  const handleConnect = (connectorName: string) => {
    disconnect();
    setActivatingConnector(connectorName);
    connect(connectorName);
    setConnectOpen(false);
  };

  const connectorsRender = [...connectors.keys()].map((name: string) => {
    const currentConnector = connectors.get(name);
    const activating = currentConnector === activatingConnector;
    const connected = currentConnector === connector;

    return (
      <Box
        key={name}
        onClick={() => !connected && handleConnect(name)}
        border={{ color: 'tailwind-blue', size: 'xsmall' }}
        hoverIndicator={{ color: 'tailwind-blue', size: 'xsmall' }}
        pad="small"
        round="small"
      >
        <Box direction="row" gap="xsmall" align="center">
          {connected && <FiCheckSquare color="green" />}
          {activating ? 'Connecting' : connectorNames.get(name)}
        </Box>
      </Box>
    );
  });

  return (
    <Box basis="auto" width="medium" pad="small" gap="small">
      <Box justify="between" align="center" direction="row">
        {account ? (
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
      <Box gap="xsmall">{connectorsRender}</Box>
    </Box>
  );
};

export default Connect;

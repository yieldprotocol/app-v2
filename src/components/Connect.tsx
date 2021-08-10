import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Text } from 'grommet';
import { FiCheckSquare, FiX } from 'react-icons/fi';
import { ChainContext, connectorNames } from '../contexts/ChainContext';
import Disclaimer from './Disclaimer';

const Connect = ({ setConnectOpen }: any) => {
  const {
    chainState: { connector, connectors, disclaimerChecked },
    chainActions: { connect, disconnect, setDisclaimerChecked },
  } = useContext(ChainContext);

  const [activatingConnector, setActivatingConnector] = useState<any>();

  /* Handle logic to recognize the connector currently being activated */
  useEffect(() => {
    activatingConnector && activatingConnector === connector && setActivatingConnector(undefined);
  }, [activatingConnector, connector]);

  const handleConnect = (connectorName: string) => {
    setActivatingConnector(connectorName);
    disconnect();
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
        pad="small"
        round="small"
        border={{ color: 'tailwind-blue', size: 'xsmall' }}
        background={connected ? '#F3F4F6' : 'white'}
        hoverIndicator={{
          background: { color: connected ? '#F3F4F6' : 'tailwind-blue' },
          color: connected ? 'red' : 'white',
        }}
        direction="row"
        gap="xsmall"
        align="center"
      >
        {connected && <FiCheckSquare color="green" />}
        {activating ? 'Connecting' : connectorNames.get(name)}
      </Box>
    );
  });

  return (
    <Box basis="auto" width="medium" pad="small" gap="small">
      <Box justify="between" align="center" direction="row">
        <Text>Connect</Text>
        <Button icon={<FiX size="1.5rem" />} onClick={() => setConnectOpen(false)} plain />
      </Box>
      {disclaimerChecked ? (
        <Box gap="xsmall">{connectorsRender}</Box>
      ) : (
        <Box border={{ color: disclaimerChecked ? 'none' : 'tailwind-blue' }} round="small">
          <Disclaimer checked={disclaimerChecked} setChecked={setDisclaimerChecked} />
        </Box>
      )}
    </Box>
  );
};

export default Connect;

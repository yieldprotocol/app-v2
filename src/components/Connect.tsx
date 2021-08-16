import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Box, Button, Text } from 'grommet';
import { FiCheckSquare, FiX } from 'react-icons/fi';
import { ChainContext, connectorNames } from '../contexts/ChainContext';
import BackButton from './buttons/BackButton';
import Disclaimer from './Disclaimer';
import { useCachedState } from '../hooks/generalHooks';

const Connect = ({ setSettingsOpen, setConnectOpen }: any) => {
  const {
    chainState: { account, connector, connectors },
    chainActions: { connect, disconnect },
  } = useContext(ChainContext);

  const [disclaimerCheckedInStorage, setDisclaimerCheckedInStorage] = useCachedState('disclaimerChecked', false);
  const [disclaimerChecked, setDisclaimerChecked] = useState<boolean>(disclaimerCheckedInStorage);

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

  useEffect(() => {
    setDisclaimerCheckedInStorage(disclaimerChecked);
  }, [disclaimerChecked, setDisclaimerCheckedInStorage]);

  const connectorsRender = [...connectors.keys()].map((name: string) => {
    const currentConnector = connectors.get(name);
    const activating = currentConnector === activatingConnector;
    const connected = currentConnector === connector;

    return (
      <Box
        key={name}
        onClick={() => !connected && disclaimerChecked && handleConnect(name)}
        pad="small"
        round="xsmall"
        border={{ color: disclaimerChecked ? 'tailwind-blue' : '#F3F4F6', size: 'xsmall' }}
        background={connected ? '#F3F4F6' : 'white'}
        hoverIndicator={{
          background: { color: connected || !disclaimerChecked ? '#F3F4F6' : 'tailwind-blue' },
          color: connected ? 'gray' : 'white',
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
    <Box fill="vertical" basis="auto" width="medium" pad="small" gap="small">
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

      {!disclaimerChecked && (
        <Box border={{ color: disclaimerChecked ? 'none' : 'tailwind-blue' }} round="small">
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

import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Text } from 'grommet';
import { FiCheckSquare, FiX } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';

const Connect = ({ setConnectOpen }: any) => {
  const {
    chainState: { connector, connectors },
    chainActions: { connect },
  } = useContext(ChainContext);

  const [activatingConnector, setActivatingConnector] = useState<any>();

  /* Handle logic to recognize the connector currently being activated */
  useEffect(() => {
    activatingConnector && activatingConnector === connector && setActivatingConnector(undefined);
  }, [activatingConnector, connector]);

  const connectorsRender = [...connectors.keys()].map((name: string) => {
    const currentConnector = connectors.get(name);
    const activating = currentConnector === activatingConnector;
    const connected = currentConnector === connector;

    return (
      <Box
        key={name}
        onClick={() => {
          setActivatingConnector(name);
          connect(name);
        }}
        border={{ color: 'tailwind-blue', size: 'xsmall' }}
        hoverIndicator={{ color: 'tailwind-blue', size: 'xsmall' }}
        pad="small"
        round="small"
      >
        <Box direction="row" gap="xsmall">
          {connected && <FiCheckSquare color="green" />}
          {activating ? 'Connecting' : name}
        </Box>
      </Box>
    );
  });

  return (
    <Box basis="auto" width="medium" pad="small" gap="small">
      <Box justify="between" align="center" direction="row">
        <Text>Connect</Text>
        <Button icon={<FiX size="1.5rem" />} onClick={() => setConnectOpen(false)} plain />
      </Box>
      <Box gap="xsmall">{connectorsRender}</Box>
    </Box>
  );
};

export default Connect;

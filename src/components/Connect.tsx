import { useContext } from 'react';
import { Box, Button, ResponsiveContext, Text } from 'grommet';
import { FiX } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';
import BackButton from './buttons/BackButton';
import Disclaimer from './Disclaimer';
import { SettingsContext } from '../contexts/SettingsContext';
import { ISettingsContext } from '../types';
import GeneralButton from './buttons/GeneralButton';

const Connect = ({ setSettingsOpen, setConnectOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    settingsState: { disclaimerChecked, darkMode },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext) as ISettingsContext;

  const {
    chainState: {
      connection: { account, activatingConnector, CONNECTORS, CONNECTOR_INFO, connectionName, connector },
    },
    chainActions: { connect },
  } = useContext(ChainContext);

  const handleConnect = (connectorName: string) => {
    connect(connectorName);
    setConnectOpen(false);
    setSettingsOpen(false);
  };

  return (
    <Box
      fill="vertical"
      width={mobile ? undefined : '400px'}
      gap="small"
      elevation={darkMode ? 'large' : 'small'}
      background="lightBackground"
      round="small"
    >
      <Box
        justify="between"
        align="center"
        direction="row"
        background="gradient"
        pad="medium"
        round={{ corner: 'top', size: 'small' }}
      >
        {account && CONNECTORS ? (
          <BackButton
            action={() => {
              setSettingsOpen(true);
              setConnectOpen(false);
            }}
          />
        ) : (
          <Text size="small" color="text">
            Connect a wallet
          </Text>
        )}

        <Button icon={<FiX size="1.5rem" color="text" />} onClick={() => setConnectOpen(false)} plain />
      </Box>
      {disclaimerChecked === false && (
        <Box border={{ color: 'brand' }} round="small" pad="medium">
          <Disclaimer
            checked={disclaimerChecked}
            onChange={(event: any) => updateSetting('disclaimerChecked', event.target.checked)}
          />
        </Box>
      )}
      <Box pad="medium" gap={mobile ? 'large' : 'small'}>
        {[...CONNECTORS.keys()].map((name: string) => {
          const { displayName, image } = CONNECTOR_INFO.get(name);
          const currentConnector = CONNECTORS.get(name);
          const activating = currentConnector === activatingConnector;
          const connected = connector && name === connectionName;

          return (
            <GeneralButton
              key={name}
              action={() => !connected && handleConnect(name)}
              background={connected ? 'gradient' : 'gradient-transparent'}
              disabled={disclaimerChecked === false}
            >
              <Box direction="row" gap="xsmall">
                {activating ? (
                  <Text size="small" color={connected ? 'white' : 'text'}>
                    'Connecting'
                  </Text>
                ) : (
                  <Box direction="row" gap="small" align="center">
                    <Text size="small" color={connected ? 'white' : 'text'} textAlign="center">
                      {displayName}
                    </Text>
                    <Box height="24px" width="24px">
                      {image()}
                    </Box>
                  </Box>
                )}
              </Box>
            </GeneralButton>
          );
        })}
      </Box>
    </Box>
  );
};

export default Connect;

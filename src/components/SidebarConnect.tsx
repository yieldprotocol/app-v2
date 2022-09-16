import { useContext } from 'react';
import { Box, ResponsiveContext, Text } from 'grommet';
import BackButton from './buttons/BackButton';
import Disclaimer from './Disclaimer';
import { Settings, SettingsContext } from '../contexts/SettingsContext';
import { ISettingsContext } from '../types';
import YieldMark from './logos/YieldMark';
import { useAccount, useConnect } from 'wagmi';

const Connect = ({ setSettingsOpen, setConnectOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    settingsState: { disclaimerChecked, darkMode },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext) as ISettingsContext;

  const { connector: activeConnector, isConnected } = useAccount();
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect();

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
        background="gradient-transparent"
        pad="medium"
        round={{ corner: 'top', size: 'small' }}
      >
        {isConnected ? (
          <BackButton
            action={() => {
              setSettingsOpen(true);
              setConnectOpen(false);
            }}
          />
        ) : (
          <Box fill="horizontal" direction="row" gap="small" align="center">
            <Box height="1.5em">
              <YieldMark />
            </Box>
            <Text size="medium" weight="lighter" color="text">
              Connect a wallet
            </Text>
          </Box>
        )}

        {/* <Button icon={<FiX size="1.5rem" color="text" />} onClick={() => setConnectOpen(false)} plain /> */}
      </Box>

      {disclaimerChecked === false && (
        <Box border={{ color: 'brand' }} round="small" pad="medium">
          <Disclaimer
            checked={disclaimerChecked}
            onChange={(event: any) => updateSetting(Settings.DISCLAIMER_CHECKED, event.target.checked)}
          />
        </Box>
      )}

      <div>
        {connectors.map((connector) => (
          <button disabled={!connector.ready} key={connector.id} onClick={() => connect({ connector })}>
            {connector.name}
            {!connector.ready && ' (unsupported)'}
            {isLoading && connector.id === pendingConnector?.id && ' (connecting)'}
          </button>
        ))}

        {error && <div>{error.message}</div>}
      </div>

      {/* <Box pad="medium" gap={mobile ? 'large' : 'small'}>
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
                    Connecting
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
      </Box> */}
    </Box>
  );
};

export default Connect;

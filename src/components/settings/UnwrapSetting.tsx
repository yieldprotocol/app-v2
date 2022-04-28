import { useContext } from 'react';
import { Box, Text } from 'grommet';
import Switch from 'react-switch';
import { Settings, SettingsContext } from '../../contexts/SettingsContext';
import { ChainContext } from '../../contexts/ChainContext';

const UnwrapSetting = () => {
  const {
    chainState: {
      connection: { connectionName },
    },
  } = useContext(ChainContext);

  const {
    settingsState: { unwrapTokens },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  return (
    // <Box gap="small" pad={{ vertical: 'small' }} border={{ side: 'bottom', color: 'text-xweak' }}>
    <Box gap="small" pad={{ vertical: 'small' }}>
      <Box direction="row" justify="between">
        <Text size="small" color={connectionName === 'metamask' ? undefined : 'text-xweak'}>
          Auto-unwrap tokens
        </Text>
        <Switch
          width={55}
          checked={unwrapTokens}
          offColor="#BFDBFE"
          onColor="#60A5FA"
          uncheckedIcon={false}
          checkedIcon={false}
          onChange={(val: boolean) => updateSetting(Settings.UNWRAP_TOKENS, val)}
          handleDiameter={20}
          borderRadius={20}
        />
      </Box>
    </Box>
  );
};

export default UnwrapSetting;

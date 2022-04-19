import { useContext } from 'react';
import { Box, Text } from 'grommet';
import Switch from 'react-switch';
import { ApprovalType } from '../../types';
import { Settings, SettingsContext } from '../../contexts/SettingsContext';
import { ChainContext } from '../../contexts/ChainContext';

const UnwrapSetting = () => {
  const {
    chainState: {
      connection: { connectionName },
    },
  } = useContext(ChainContext);

  const {
    settingsState: { unwrapToken },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  return (
    // <Box gap="small" pad={{ vertical: 'small' }} border={{ side: 'bottom', color: 'text-xweak' }}>
    <Box gap="small" pad={{ vertical: 'small' }}>
      <Box direction="row" justify="between">
        <Text size="small" color={connectionName === 'metamask' ? undefined : 'text-xweak'}>
          Automatically unwrap wrapped tokens
        </Text>
        <Switch
          width={55}
          checked={unwrapToken}
          offColor="#BFDBFE"
          onColor="#60A5FA"
          uncheckedIcon={false}
          checkedIcon={false}
          onChange={(val: boolean) => updateSetting(Settings.UNWRAP_TOKENS, val)}
          handleDiameter={20}
          borderRadius={20}
          disabled={connectionName !== 'metamask'}
        />
      </Box>
    </Box>
  );
};

export default UnwrapSetting;

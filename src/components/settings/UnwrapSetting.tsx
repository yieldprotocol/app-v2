import { useContext } from 'react';
import { Box, Text } from 'grommet';
import Switch from 'react-switch';
import { Settings, SettingsContext } from '../../contexts/SettingsContext';

const UnwrapSetting = () => {
  const {
    settingsState: { unwrapTokens },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  return (
    <Box gap="small" pad={{ vertical: 'small' }}>
      <Box direction="row" justify="between">
        <Text size="small" color="text-xweak">
          Auto-unwrap tokens
        </Text>
        <Switch
          disabled
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

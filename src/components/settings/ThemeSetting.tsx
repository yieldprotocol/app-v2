import { useContext } from 'react';
import Switch from 'react-switch';

import { Box, Text } from 'grommet';
import { FiMoon, FiSun } from 'react-icons/fi';
import { Settings, SettingsContext } from '../../contexts/SettingsContext';

const ThemeSettings = () => {
  const {
    settingsState: { darkMode, autoTheme },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  return (
    <Box gap="small" pad={{ vertical: 'small' }}>
      <Box direction="row" justify="between">
        <Text size="small">Use System Color Theme</Text>
        <Switch
          width={55}
          checked={autoTheme}
          uncheckedIcon={
            <Box align="center" justify="center" fill pad="xsmall">
              <Text size="0.5em"> Off </Text>
            </Box>
          }
          checkedIcon={
            <Box align="center" justify="center" fill pad="xsmall">
              <Text size="0.5em"> Auto </Text>
            </Box>
          }
          offColor="#BFDBFE"
          onColor="#60A5FA"
          onChange={(val: boolean) => updateSetting(Settings.AUTO_THEME, val)}
          handleDiameter={20}
          borderRadius={20}
        />
      </Box>

      <Box direction="row" justify="between">
        <Text size="small" color={autoTheme ? 'text-xweak' : 'text'}>
          Color Theme
        </Text>
        <Switch
          width={55}
          checked={darkMode}
          uncheckedIcon={
            autoTheme ? (
              false
            ) : (
              <Box align="center" justify="center" fill pad="xsmall">
                <FiSun color="text" style={{ strokeWidth: '3' }} />
              </Box>
            )
          }
          checkedIcon={
            autoTheme ? (
              false
            ) : (
              <Box align="center" justify="center" fill pad="xsmall">
                <FiMoon color="text" style={{ strokeWidth: '3', fill: 'Background' }} />
              </Box>
            )
          }
          offColor="#BFDBFE"
          onColor="#60A5FA"
          onChange={(val: boolean) => updateSetting(Settings.DARK_MODE, val)}
          handleDiameter={20}
          borderRadius={20}
          disabled={autoTheme}
        />
      </Box>
    </Box>
  );
};

export default ThemeSettings;

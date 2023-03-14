import { useContext } from 'react';
import Switch from 'react-switch';

import { Box, Text } from 'grommet';
import { FiMoon, FiSun } from 'react-icons/fi';
import { SettingsContext } from '../../contexts/SettingsContext';
import { Settings } from '../../contexts/types/settings';

const ThemeSettings = () => {
  const {
    settingsState: { darkMode },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  return (
    <Box gap="small" pad={{ vertical: 'small' }}>
      <Box direction="row" justify="between">
        <Text size="small" color={'text'}>
          Color Theme
        </Text>
        <Switch
          width={55}
          checked={darkMode}
          uncheckedIcon={
            <Box align="center" justify="center" fill pad="xsmall">
              <FiSun color="text" style={{ strokeWidth: '3' }} />
            </Box>
          }
          checkedIcon={
            <Box align="center" justify="center" fill pad="xsmall">
              <FiMoon color="text" style={{ strokeWidth: '3', fill: 'Background' }} />
            </Box>
          }
          offColor="#BFDBFE"
          onColor="#60A5FA"
          onChange={(val: boolean) => updateSetting(Settings.DARK_MODE, val)}
          handleDiameter={20}
          borderRadius={20}
        />
      </Box>
    </Box>
  );
};

export default ThemeSettings;

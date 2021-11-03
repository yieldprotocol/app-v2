import React, { useContext } from 'react';
import { Box, CheckBox, Text } from 'grommet';
import { FiCheck, FiMoon, FiSun, FiX } from 'react-icons/fi';
import { ThemeContext } from 'styled-components';
import Switch from 'react-switch';
import SlippageSettings from './SlippageSettings';
import { ApprovalType } from '../types';
import { ChainContext } from '../contexts/ChainContext';
import { SettingsContext } from '../contexts/SettingsContext';

const AdvancedSettings = () => {
  const {
    settingsState: { approvalMethod, powerUser, approveMax, darkMode },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  const theme = useContext<any>(ThemeContext);
  const { purple } = theme.global.colors;

  const {
    chainState: {
      connection: { connectionName },
    },
  } = useContext(ChainContext);

  const handleApprovalToggle = (type: ApprovalType) => {
    updateSetting('approvalMethod', type);
  };

  const handleDarkModeToggle = (isDark: boolean) => {
    updateSetting('darkMode', isDark);
  };

  if (connectionName === 'ledgerWithMetamask') return null;
  return (
    <Box fill="horizontal" gap="medium">
      <Box gap="small" pad={{ vertical: 'small' }} border={{ color: 'tailwind-blue-100', side: 'bottom' }}>
        <Box direction="row" justify="between">
          <Text size="small">Use Approval by Transactions</Text>
          <Switch
            width={55}
            checked={approvalMethod === ApprovalType.TX}
            offColor="#BFDBFE"
            onColor="#60A5FA"
            uncheckedIcon={false}
            checkedIcon={false}
            onChange={(val) => (val ? handleApprovalToggle(ApprovalType.TX) : handleApprovalToggle(ApprovalType.SIG))}
            handleDiameter={20}
            borderRadius={20}
          />
        </Box>
        <Box direction="row" justify="between">
          <Text size="small">Theme</Text>
          <Switch
            width={55}
            checked={darkMode}
            uncheckedIcon={
              <Box align="center" justify="center" fill pad="xsmall">
                <FiSun color="gray" style={{ strokeWidth: '3' }} />
              </Box>
            }
            checkedIcon={
              <Box align="center" justify="center" fill pad="xsmall">
                <FiMoon color={purple} style={{ strokeWidth: '3', fill: 'Background' }} />
              </Box>
            }
            offColor="#BFDBFE"
            onColor="#60A5FA"
            onChange={handleDarkModeToggle}
            handleDiameter={20}
            borderRadius={20}
          />
        </Box>
      </Box>
      <SlippageSettings />

      <Box direction="row" justify="between">
        <Text size="small">PowerUser</Text>
        <Switch
          checked={powerUser}
          onChange={(val: boolean) => updateSetting('powerUser', val)}
          width={55}
          offColor="#BFDBFE"
          onColor="#60A5FA"
          uncheckedIcon={false}
          checkedIcon={false}
          handleDiameter={20}
          borderRadius={20}
        />
      </Box>

      <Box direction="row" justify="between">
        <Text size="small">Approve Max</Text>
        <Switch
          checked={approveMax}
          onChange={(val: boolean) => updateSetting('approveMax', val)}
          width={55}
          offColor="#BFDBFE"
          onColor="#60A5FA"
          uncheckedIcon={false}
          checkedIcon={false}
          handleDiameter={20}
          borderRadius={20}
        />
      </Box>
    </Box>
  );
};

export default AdvancedSettings;

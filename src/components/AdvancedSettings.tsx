import React, { useContext } from 'react';
import { Box, Text } from 'grommet';
import { FiMoon, FiSun } from 'react-icons/fi';
import { ThemeContext } from 'styled-components';
import Switch from 'react-switch';
import SlippageSettings from './SlippageSettings';
import { ApprovalType } from '../types';
import { ChainContext } from '../contexts/ChainContext';
import { SettingsContext } from '../contexts/SettingsContext';

const AdvancedSettings = () => {
  const {
    settingsState: { approvalMethod, approveMax, darkMode, autoTheme },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  const theme = useContext<any>(ThemeContext);
  const { colors } = theme.global;

  const {
    chainState: {
      connection: { connectionName },
    },
  } = useContext(ChainContext);

  const handleApprovalToggle = (type: ApprovalType) => {
    updateSetting('approvalMethod', type);
  };

  if (connectionName === 'ledgerWithMetamask') return null;
  return (
    <Box fill="horizontal" gap="medium">


      <Box gap='xsmall'>
      <Box direction="row" justify="between">
        <Text size="small">Use System Color Theme</Text>
        <Switch
          width={55}
          checked={autoTheme}
          uncheckedIcon={false}
          checkedIcon={
            <Box align="end" justify="center" fill pad='xsmall'>
              <Text size='0.5em'> Auto </Text>
            </Box>
          }
          offColor="#BFDBFE"
          onColor="#60A5FA"
          onChange={(val: boolean) => updateSetting('autoTheme', val)}
          handleDiameter={20}
          borderRadius={20}
        />
      </Box>

      <Box direction="row" justify="between">
        <Text size="small" color={autoTheme? 'text-xweak': 'text'}>Color Theme</Text>
        <Switch
          width={55}
          checked={darkMode}
          uncheckedIcon={
            autoTheme? false : <Box align="center" justify="center" fill pad="xsmall">
              <FiSun color="text" style={{ strokeWidth: '3' }} />
            </Box>
          }
          checkedIcon={
            autoTheme? false : <Box align="center" justify="center" fill pad="xsmall">
              <FiMoon color={colors.brand} style={{ strokeWidth: '3', fill: 'Background' }} />
            </Box>
          }
          offColor="#BFDBFE"
          onColor="#60A5FA"
          onChange={(val: boolean) => updateSetting('darkMode', val)}
          handleDiameter={20}
          borderRadius={20}
          disabled={ autoTheme}
        />
      </Box>
      </Box>

      <Box gap="small" pad={{ vertical: 'small' }}>
        <Box direction="row" justify="between">
          <Text size="small">Use Approval by Transactions</Text>
          <Switch
            width={55}
            checked={approvalMethod === ApprovalType.TX}
            offColor="#BFDBFE"
            onColor="#60A5FA"
            uncheckedIcon={false}
            checkedIcon={false}
            onChange={(val: boolean) =>
              val ? handleApprovalToggle(ApprovalType.TX) : handleApprovalToggle(ApprovalType.SIG)
            }
            handleDiameter={20}
            borderRadius={20}
          />
        </Box>

        <Box direction="row" justify="between">
          <Text size="small" color={approvalMethod === ApprovalType.TX ? undefined : 'text-xweak'}>
            Approve Max
          </Text>
          <Switch
            checked={approvalMethod !== ApprovalType.TX ? false : approveMax}
            onChange={(val: boolean) => updateSetting('approveMax', val)}
            width={55}
            offColor="#BFDBFE"
            onColor="#60A5FA"
            uncheckedIcon={false}
            checkedIcon={false}
            handleDiameter={20}
            borderRadius={20}
            disabled={approvalMethod !== ApprovalType.TX}
          />
        </Box>
      </Box>

      <SlippageSettings />

      {/* <Box direction="row" justify="between">
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
      </Box> */}
    </Box>
  );
};

export default AdvancedSettings;

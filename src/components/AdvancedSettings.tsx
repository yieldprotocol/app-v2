import React, { useContext } from 'react';
import { Box, CheckBox, Text } from 'grommet';
import { FiMoon, FiSun } from 'react-icons/fi';
import { ThemeContext } from 'styled-components';
import Switch from 'react-switch';
import { UserContext } from '../contexts/UserContext';
import SlippageSettings from './SlippageSettings';
import { ApprovalType } from '../types';
import { useCachedState } from '../hooks/generalHooks';
import { ChainContext } from '../contexts/ChainContext';

const AdvancedSettings = () => {
  const {
    userState: { approvalMethod, darkMode },
    userActions: { setApprovalMethod, toggleDarkMode },
  } = useContext(UserContext);

  const theme = useContext<any>(ThemeContext);
  const { purple } = theme.global.colors;

  const {
    chainState: {
      connection: { connectionName },
    },
  } = useContext(ChainContext);

  const [, setCachedApprovalMethod] = useCachedState('cachedApprovalMethod', approvalMethod);
  const [, toggleCachedDarkMode] = useCachedState('darkMode', darkMode);

  const handleApprovalToggle = (type: ApprovalType) => {
    /* set for current session */
    setApprovalMethod(type);
    /* set cached for future sessions */
    setCachedApprovalMethod(type);
  };

  const handleDarkModeToggle = (isDark: boolean) => {
    toggleDarkMode(isDark);
    toggleCachedDarkMode(isDark);
  };

  if (connectionName === 'ledgerWithMetamask') return null;
  return (
    <Box fill="horizontal" gap="medium">
      <Box gap="small" pad={{ vertical: 'small' }} border={{ color: 'tailwind-blue-100', side: 'bottom' }}>
        <Box direction="row" justify="between">
          <Text size="small">Use Approval Method</Text>
          <CheckBox
            toggle
            checked={approvalMethod === ApprovalType.TX}
            onChange={(event) =>
              event?.target.checked ? handleApprovalToggle(ApprovalType.TX) : handleApprovalToggle(ApprovalType.SIG)
            }
          />
        </Box>
        <Box direction="row" justify="between">
          <Text size="small">Theme</Text>
          <Switch
            width={55}
            checked={darkMode}
            uncheckedIcon={
              <Box align="center" justify="center" fill pad="xsmall">
                <FiSun color="gray" />
              </Box>
            }
            checkedIcon={
              <Box align="center" justify="center" fill pad="xsmall">
                <FiMoon color={purple} />
              </Box>
            }
            offColor="#EFF6FF"
            onColor="#BFDBFE"
            onChange={handleDarkModeToggle}
            handleDiameter={20}
            borderRadius={20}
          />
        </Box>
      </Box>
      <SlippageSettings />
    </Box>
  );
};

export default AdvancedSettings;

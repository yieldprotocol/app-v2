import React, { useContext } from 'react';
import { Box, CheckBox, Text } from 'grommet';
import SlippageSettings from './SlippageSettings';
import { ApprovalType } from '../types';
import { ChainContext } from '../contexts/ChainContext';
import { SettingsContext } from '../contexts/SettingsContext';

const AdvancedSettings = () => {
  const {
    settingsState: { approvalMethod, powerUser, approveMax },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  const {
    chainState: {
      connection: { connectionName },
    },
  } = useContext(ChainContext);

  const handleApprovalToggle = (type: ApprovalType) => {
    /* set for current session */
    updateSetting('approvalMethod', type);
  };

  if (connectionName === 'ledgerWithMetamask') return null;
  return (
    <Box fill="horizontal" gap="medium">
      <Box gap="small" pad={{ vertical: 'small' }} border={{ color: 'tailwind-blue-100', side: 'bottom' }}>
        <Box direction="row" justify="between">
          <Text size="small">Use Approval by Transactions</Text>
          <CheckBox
            toggle
            checked={approvalMethod === ApprovalType.TX}
            onChange={(event) =>
              event?.target.checked ? handleApprovalToggle(ApprovalType.TX) : handleApprovalToggle(ApprovalType.SIG)
            }
          />
        </Box>
      </Box>
      <SlippageSettings />

      <Box direction="row" justify="between">

          <Text size="small">PowerUser</Text>
          <CheckBox
            toggle
            checked={powerUser}
            onChange={(event:any) => updateSetting('powerUser', event?.target.checked)}
          />
        </Box>

        <Box direction="row" justify="between">
          <Text size="small">Approve Max</Text>
          <CheckBox
            toggle
            checked={approveMax}
            onChange={(event:any) => updateSetting('approveMax', event?.target.checked)}
          />
        </Box>

    </Box>
  );
};

export default AdvancedSettings;

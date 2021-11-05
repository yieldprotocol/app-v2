import React, { useContext } from 'react';
import { Box, Text } from 'grommet';
import Switch from 'react-switch';
import { ApprovalType } from '../../types';
import { SettingsContext } from '../../contexts/SettingsContext';

const AdvancedSetting = () => {
  const {
    settingsState: { approvalMethod, approveMax },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  const handleApprovalToggle = (type: ApprovalType) => {
    updateSetting('approvalMethod', type);
  };

  return (
    <Box gap="small" pad={{ vertical: 'small' }} border={{ side: 'bottom', color: 'text-xweak' }}>
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
  );
};

export default AdvancedSetting;

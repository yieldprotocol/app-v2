import React, { useContext, useEffect } from 'react';
import { Box, Text } from 'grommet';
import Switch from 'react-switch';
import { ApprovalType } from '../../types';
import { SettingsContext } from '../../contexts/SettingsContext';
import { ChainContext } from '../../contexts/ChainContext';

const AdvancedSetting = () => {

  const {
    chainState: {
      connection: { connectionName },
    },
  } = useContext(ChainContext);

  const {
    settingsState: { approvalMethod, approveMax },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  const handleApprovalToggle = (type: ApprovalType) => {
    updateSetting('approvalMethod', type);
  };

  /* double check not max with permits */
  useEffect(()=>{
    approvalMethod !== ApprovalType.TX && updateSetting('approveMax', false);
  },[ approvalMethod ])

  return (
    // <Box gap="small" pad={{ vertical: 'small' }} border={{ side: 'bottom', color: 'text-xweak' }}>
    <Box gap="small" pad={{ vertical: 'small' }}>
      <Box direction="row" justify="between">
        <Text size="small" color={connectionName !== 'ledgerWithMetamask' ? undefined : 'text-xweak'} >Use Approval by Transactions</Text>
        <Switch
          width={55}
          checked={approvalMethod === ApprovalType.TX || connectionName === 'ledgerWithMetamask' }
          offColor="#BFDBFE"
          onColor="#60A5FA"
          uncheckedIcon={false}
          checkedIcon={false}
          onChange={(val: boolean) =>
            val ? handleApprovalToggle(ApprovalType.TX) : handleApprovalToggle(ApprovalType.SIG)
          }
          handleDiameter={20}
          borderRadius={20}
          disabled={ connectionName === 'ledgerWithMetamask' }
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

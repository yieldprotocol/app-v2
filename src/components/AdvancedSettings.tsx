import React, { useContext, useEffect, useState } from 'react';
import { Box, CheckBox, Text } from 'grommet';
import { UserContext } from '../contexts/UserContext';
import SlippageSettings from './SlippageSettings';
import { ApprovalType } from '../types';

const AdvancedSettings = () => {
  const {
    userState: { showInactiveVaults, approvalMethod },
    userActions: { setShowInactiveVaults, setApprovalMethod },
  } = useContext(UserContext);

  return (
    <Box fill="horizontal" gap="medium">
      <Box gap="small" pad={{ vertical: 'small' }} border={{ color: 'tailwind-blue-100', side: 'bottom' }}>
        <Box direction="row" justify="between">
          <Text size="small">Use Approval Method</Text>
          <CheckBox
            toggle
            checked={approvalMethod === ApprovalType.TX}
            onChange={(event) =>
              event?.target.checked ? setApprovalMethod(ApprovalType.TX) : setApprovalMethod(ApprovalType.SIG)
            }
          />
        </Box>
        <Box direction="row" justify="between">
          <Text size="small">Show Inactive Vaults</Text>
          <CheckBox
            toggle
            checked={showInactiveVaults}
            onChange={(event) => setShowInactiveVaults(event?.target.checked)}
          />
        </Box>
      </Box>
      <SlippageSettings />
    </Box>
  );
};

export default AdvancedSettings;

import React, { useContext, useEffect, useState } from 'react';
import { Box, CheckBox, Text } from 'grommet';
import { UserContext } from '../contexts/UserContext';
import SlippageSettings from './SlippageSettings';
import { ApprovalType } from '../types';
import { useCachedState } from '../hooks/generalHooks';

const AdvancedSettings = () => {
  const {
    userState: { showInactiveVaults, approvalMethod },
    userActions: { setShowInactiveVaults, setApprovalMethod },
  } = useContext(UserContext);

  const [cachedApprovalMethod, setCachedApprovalMethod] = useCachedState('cachedApprovalMethod', approvalMethod);

  const handleApprovalToggle = (type: ApprovalType) => {
    /* set for current session */
    setApprovalMethod(type);
    /* set cached for future sessions */
    setCachedApprovalMethod(type);
  };

  /* update the cached approval method if any changes made via connections */
  useEffect(() => {
    setCachedApprovalMethod(approvalMethod);
  }, [approvalMethod, setCachedApprovalMethod]);

  return (
    <Box fill="horizontal" gap="medium">
      <Box gap="small" pad={{ vertical: 'small' }} border={{ color: 'tailwind-blue-100', side: 'bottom' }}>
        <Box direction="row" justify="between">
          <Text size="small">Use Approval Method</Text>
          <CheckBox
            toggle
            checked={cachedApprovalMethod === ApprovalType.TX}
            onChange={(event) =>
              event?.target.checked ? handleApprovalToggle(ApprovalType.TX) : handleApprovalToggle(ApprovalType.SIG)
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

import React, { useContext } from 'react';
import { Box, CheckBox, Text } from 'grommet';
import { UserContext } from '../contexts/UserContext';
import SlippageSettings from './SlippageSettings';
import { ApprovalType } from '../types';
import { useCachedState } from '../hooks/generalHooks';

const AdvancedSettings = () => {
  const {
    userState: { approvalMethod },
    userActions: { setApprovalMethod },
  } = useContext(UserContext);

  const [, setCachedApprovalMethod] = useCachedState('cachedApprovalMethod', approvalMethod);

  const handleApprovalToggle = (type: ApprovalType) => {
    /* set for current session */
    setApprovalMethod(type);
    /* set cached for future sessions */
    setCachedApprovalMethod(type);
  };

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
      </Box>
      <SlippageSettings />
    </Box>
  );
};

export default AdvancedSettings;

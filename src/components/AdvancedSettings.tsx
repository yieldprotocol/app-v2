import React, { useContext, useEffect, useState } from 'react';
import { Box, CheckBox, Text } from 'grommet';
import { UserContext } from '../contexts/UserContext';
import SlippageSettings from './SlippageSettings';
import HideBalancesSetting from './HideBalancesSetting';

const AdvancedSettings = () => {
  const {
    userState: { showInactiveVaults },
    userActions: { setShowInactiveVaults },
  } = useContext(UserContext);

  return (
    <Box fill="horizontal" gap="medium">
      <Box
        direction="row"
        justify="between"
        pad={{ vertical: 'small' }}
        border={{ color: 'tailwind-blue-100', side: 'bottom' }}
      >
        <Text size="small">Show Inactive Vaults</Text>
        <CheckBox
          toggle
          checked={showInactiveVaults}
          onChange={(event) => setShowInactiveVaults(event?.target.checked)}
        />
      </Box>
      <SlippageSettings />
      <HideBalancesSetting width="25%" />
    </Box>
  );
};

export default AdvancedSettings;

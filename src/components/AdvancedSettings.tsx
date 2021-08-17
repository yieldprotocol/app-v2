import React, { useContext, useEffect, useState } from 'react';
import { Box, CheckBox, Text } from 'grommet';
import { UserContext } from '../contexts/UserContext';
import SlippageSettings from './SlippageSettings';

const AdvancedSettings = () => {
  const {
    userState: { showInactiveVaults },
    userActions: { setShowInactiveVaults },
  } = useContext(UserContext);

  return (
    <Box fill="horizontal" gap="small">
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
    </Box>
  );
};

export default AdvancedSettings;

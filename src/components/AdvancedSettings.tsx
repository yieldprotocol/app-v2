import React, { useContext, useEffect, useState } from 'react';
import { Box, CheckBox, Text } from 'grommet';
import { UserContext } from '../contexts/UserContext';

const AdvancedSettings = () => {
  const {
    userState: { showInactiveVaults },
    userActions: { setShowInactiveVaults },
  } = useContext(UserContext);

  return (
    <Box fill="horizontal" gap="small">
      <Box direction="row" justify="between">
        <Text size="small">Show Inactive Vaults</Text>
        <CheckBox
          toggle
          checked={showInactiveVaults}
          onChange={(event) => setShowInactiveVaults(event?.target.checked)}
        />
      </Box>
      {/* <Box direction="row" justify="between">
        Slippage Tolerance
      </Box> */}
    </Box>
  );
};

export default AdvancedSettings;

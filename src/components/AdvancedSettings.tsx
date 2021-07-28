import React, { useState } from 'react';
import { Box, CheckBox, Text } from 'grommet';

const AdvancedSettings = () => {
  const [showInactiveVaults, setShowInactiveVaults] = useState<boolean>(false);
  return (
    <Box fill="horizontal" gap="small">
      <Box direction="row" justify="between">
        <Text size="small">Show Inactive Vaults</Text>
        <CheckBox
          toggle
          checked={showInactiveVaults}
          onChange={(event) => setShowInactiveVaults(event?.target.checked)}
          style={{ border: 'tailwind-blue' }}
        />
      </Box>
      {/* <Box direction="row" justify="between">
        Slippage Tolerance
      </Box> */}
    </Box>
  );
};

export default AdvancedSettings;

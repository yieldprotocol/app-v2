import { Box, Button } from 'grommet';
import React from 'react';

function Pool() {
  return (
    <Box
      fill
      align="center"
      gap="medium"
      pad="medium"
    >

      <Box> 1. Asset to Borrow </Box>

      <Box> 2. Select a series (maturity date) </Box>

      <Box> 3. Add Collateral </Box>

      <Box gap="small">
        <Button primary label="Borrow Dai" />
        <Button secondary label="Migrate Maker Vault" />
      </Box>

    </Box>
  );
}

export default Pool;

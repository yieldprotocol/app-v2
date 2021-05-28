import { Box, Text } from 'grommet';
import React from 'react';
import Loader from 'react-spinners/GridLoader';

interface IAprDisplay {
  label: string,
  apr: string|number|undefined,
}

function AprDisplay({ label, apr }: IAprDisplay) {
  return (
    <>
      {apr &&
      <Box animation="fadeIn" basis="50%">
        <Box pad="large" />
        <Text size="xsmall"> {label}</Text>
        <Box direction="row" align="center">

          <>
            <Text size="70px" color="brand">{apr || ''}</Text>
            <Box fill="vertical" justify="evenly">
              <Text size="large" color="brand"> % </Text>
              <Text size="large" color="brand"> APR </Text>
            </Box>
          </>
        </Box>
      </Box>}
    </>
  );
}

export default AprDisplay;

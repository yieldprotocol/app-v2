import { Box, Layer, Text } from 'grommet';
import React from 'react';

/* A kill switch is a way to disable the entire app. It is set in the .env file. ( AND next.config.js ) */
const KillSwitch = (props: any) => {


  return (
    <>
      {process.env.KILLSWITCH_ACTIVE ? (
        <Layer>
          <Box background='white' pad='large' round='16px' gap='small' >
            <Text size='large'> Yield Protocol UI is temporarily disabled.</Text>
            <Text size='small'>  </Text>
            <Text size='xsmall'> Details: {process.env.KILLSWITCH_TEXT} </Text>
          </Box>
        </Layer>
      ) : (
        <div>{props.children}</div>
      )}
    </>
  );
};

export default KillSwitch;

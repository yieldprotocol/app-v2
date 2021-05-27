import { Box, Text } from 'grommet';
import React from 'react';

function StepSelector({ selected, options, action }:{ selected:number, options: string[], action: (id:number)=>void }) {
  return (
    <Box direction="row" justify="evenly">
      { options.map((x:string, i:number) => <Text key={x} onClick={() => action(i)} size="xsmall"> {x} </Text>)}
    </Box>
  );
}

export default StepSelector;

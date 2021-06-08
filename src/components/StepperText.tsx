import { Box, Text } from 'grommet';
import React, { useState } from 'react';
import { a, useTrail, useTransition } from 'react-spring';

interface IStepperText {
  values: [string, string, string][];
  position: number
}

function StepperText({ values, position }: IStepperText) {
  return (
    <Box>
      { values.map((x:string[], i:number) => (
        <Box key={x[1]}>
          {position === i && <Text weight={900}> Step {i + 1} </Text>}
          <Box direction="row" pad={{ horizontal: 'small' }}>
            <Text weight={900} size={position === i ? 'xxlarge' : 'medium'} color={position === i ? 'text' : 'text-xweak'}> {`${x[0]}\n`}
              <Text weight={900} size={position === i ? 'xxlarge' : 'medium'} color={position === i ? 'text' : 'text-xweak'}> {x[1]} </Text>
              {x[2]}
            </Text>
          </Box>
        </Box>
      )) }
    </Box>
  );
}

export default StepperText;

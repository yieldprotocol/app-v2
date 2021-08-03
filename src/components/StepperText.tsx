import { Box, Text } from 'grommet';
import React from 'react';
import AltText from './texts/AltText';
import HandText from './texts/HandText';
import NavText from './texts/NavText';

interface IStepperText {
  values: [string, string, string][];
  position: number;
}

function StepperText({ values, position }: IStepperText) {
  return (
    <Box>
      {values.map((x: string[], i: number) => (
        <Box key={x[1]}>
          {position === i && (
            <Text weight='bold' color="text-weak" size='small'>
              STEP {i + 1}
            </Text>
          )}
          <Box direction="row">
            <AltText
              // weight={900}
              size={position === i ? 'xlarge' : 'small'}
              color={position === i ? 'text-weak' : 'text-xweak'}
            >
              {`${x[0]}\n`}
              <AltText
                // weight={900}
                size={position === i ? 'xlarge' : 'small'}
                color={position === i ? 'text-weak' : 'text-xweak'}
              >
                {x[1]}
              </AltText>
              {x[2]}
            </AltText>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default StepperText;

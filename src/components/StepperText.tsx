import { Box, Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';
import AltText from './texts/AltText';
import HandText from './texts/HandText';
import NavText from './texts/NavText';

interface IStepperText {
  values: [string, string, string][];
  position: number;
}

const StyledText = styled(AltText)`
  font-family: 'Raleway';
  background: ${(props) => props.color};
  background: -webkit-linear-gradient(60deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(5px 5px 2px #ddd);
`;

function StepperText({ values, position }: IStepperText) {
  return (
    <Box width={{ max: '200px' }} gap="small">
      {values.map((x: string[], i: number) => (
        <Box key={x[1]} >
          {position === i && (
            <Text weight="bold" color="text-weak" size="small">
              STEP {i + 1}
            </Text>
          )}
          <Box direction="row">
            {position === i ? (
              <StyledText size="medium" color="text-weak">
                {x[0]}
                <StyledText size="xxlarge" color="text-weak"> {x[1]} </StyledText>
                {x[2]}
              </StyledText>
            ) : (
              <AltText size="small" color="text-xweak">
                {`${x[0]} ${x[1]}`} {x[2]}
              </AltText>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default StepperText;

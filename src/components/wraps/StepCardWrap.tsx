import { Box, Text } from 'grommet';
import React from 'react';
import ColorText from '../texts/ColorText';

interface IStepCardWrap {
  stepData: IStepData[];
  currStep: number;
}

interface IStepData {
  step: number;
  header: string;
  body: string;
}

const StepCard = ({ step, header, body }: IStepData) => (
  <Box gap="small" elevation="medium" pad="medium" round="xsmall">
    <ColorText size="small">Step {step + 1}</ColorText>
    <Text size="small" color="text">
      {header}
    </Text>
    <Text size="xsmall" color="text-weak">
      {body}
    </Text>
  </Box>
);

const StepCardWrap = ({ stepData, currStep }: IStepCardWrap) => (
  <Box gap="small">
    {stepData
      .filter((data: IStepData) => data.step >= currStep)
      .map((data: IStepData) => (
        <StepCard key={data.step} step={data.step} header={data.header} body={data.body} />
      ))}
  </Box>
);

export default StepCardWrap;

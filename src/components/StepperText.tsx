import { Box, Text } from 'grommet';
import React, { useState } from 'react';
import { animated, useTransition } from 'react-spring';

interface IStepperText {
  values: [string, string, string][];
  position: number
}

function StepperText({ values, position }: IStepperText) {
  const [items, set] = useState<string[]>();
  const transitions = useTransition(items, {
    from: {
      opacity: 0,
      height: 0,
      innerHeight: 0,
      transform: 'perspective(600px) rotateX(0deg)',
      color: '#8fa5b6',
    },
    enter: [
      { opacity: 1, height: 80, innerHeight: 80 },
      { transform: 'perspective(600px) rotateX(180deg)', color: '#28d79f' },
      { transform: 'perspective(600px) rotateX(0deg)' },
    ],
    leave: [{ color: '#c23369' }, { innerHeight: 0 }, { opacity: 0, height: 0 }],
    update: { color: '#28b4d7' },
  });

  return (
    <Box>
      { values.map((x:string[], i:number) => (
        <Box direction="row" key={x[1]}>
          <Text weight={600} size={position === i ? 'xxlarge' : 'large'} color={position === i ? 'text' : 'text-xweak'}> {x[0]}
            <Text size={position === i ? 'xxlarge' : 'large'} color={position === i ? 'text' : 'text-xweak'}> {x[1]} </Text>
            {x[2]}
          </Text>
          {/* {transitions(({ innerHeight, ...rest }, item) => (
            <animated.div style={rest}>
              <Text weight={600} size={position === i ? 'xxlarge' : 'large'} color={position === i ? 'text' : 'text-xweak'}> {x[0]}
                <Text size={position === i ? 'xxlarge' : 'large'} color={position === i ? 'text' : 'text-xweak'}> {x[1]} </Text>
                {x[2]}
              </Text>
              <animated.div style={{ overflow: 'hidden', height: innerHeight }}>
                {item}
                </animated.div>
            </animated.div>
            ))} */}
        </Box>
      )) }
    </Box>
  );
}

export default StepperText;

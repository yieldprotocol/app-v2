import { Box, Text } from 'grommet';
import React, { useState } from 'react';
import { a, useTrail, useTransition } from 'react-spring';

interface IStepperText {
  values: [string, string, string][];
  position: number
}

const Trail: React.FC<{ open: boolean }> = ({ open, children }) => {
  const items = React.Children.toArray(children);
  const trail = useTrail(items.length, {
    config: { mass: 5, tension: 2000, friction: 200 },
    opacity: open ? 1 : 0,
    x: open ? 0 : 20,
    height: open ? 10 : 0,
    from: { opacity: 0, x: 20, height: 0 },
  });
  return (
    <div>
      {trail.map(({ height, ...style }, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <a.div key={index} style={style}>
          <a.div style={{ height }}>{items[index]}</a.div>
        </a.div>
      ))}
    </div>
  );
};

function StepperText({ values, position }: IStepperText) {
  return (
    <Box>
      { values.map((x:string[], i:number) => (
        <Box direction="row" key={x[1]}>
          <Text weight={900} size={position === i ? 'xxlarge' : 'large'} color={position === i ? 'text' : 'text-xweak'}> {x[0]}
            <Text weight={900} size={position === i ? 'xxlarge' : 'large'} color={position === i ? 'text' : 'text-xweak'}> {x[1]} </Text>
            {x[2]}
          </Text>
        </Box>
      )) }

      {/* <Trail open={position === 0}>
        <span>Lorem</span>
        <span>Ipsum</span>
        <span>Dolor</span>
        <span>Sit</span>
      </Trail>

      <Trail open={position === 1}>
        <span>bbb</span>
        <span>bbb</span>
        <span>bbb</span>
        <span>bbb</span>
      </Trail>
      <Trail open={position === 2}>
        <span>Lorem</span>
        <span>Ipsum</span>
        <span>Dolor</span>
        <span>Sit</span>
      </Trail> */}

    </Box>
  );
}

export default StepperText;

import React, { useContext, useRef } from 'react';
import { Box, Heading, ResponsiveContext, Text } from 'grommet';

import { useSpring, animated, to } from 'react-spring';
import { useGesture } from 'react-use-gesture';

interface IPanelWrap {
  basis?: string
  children: any;
}

const calcX = (y: number, ly: number) => -(y - ly - window.innerHeight / 2) / 500;
const calcY = (x: number, lx: number) => (x - lx - window.innerWidth / 2) / 500;

function CenterPanelWrap({ basis, children }: IPanelWrap) {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  const domTarget = useRef(null);
  const [{ x, y, rotateX, rotateY, rotateZ, zoom, scale }, api] = useSpring(
    () => ({
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
      zoom: 0,
      x: 0,
      y: 0,
      config: { mass: 5, tension: 350, friction: 40 },
    }),
  );

  useGesture(
    {
      onMove: ({ xy: [px, py], dragging }) => !dragging &&
        api.start({
          rotateX: calcX(py, y.get()),
          rotateY: calcY(px, x.get()),
          scale: 1.00,
        }),
      onHover: ({ hovering }) => !hovering && api.start({ rotateX: 0, rotateY: 0, scale: 1 }),
    },
    { domTarget, eventOptions: { passive: false } },
  );

  return (
    <>
      {mobile ? (
        <Box
          ref={domTarget}
        >
          {children}
        </Box>
      ) :

        <Box
          alignSelf="center"
        >
          <animated.div
            ref={domTarget}
            style={{
              transform: 'perspective(600px)',
              x,
              y,
              scale: to([scale, zoom], (s, z) => s + z),
              rotateX,
              rotateY,
              rotateZ,
            }}
          >
            <Box
              elevation={mobile ? undefined : 'large'}
              pad="large"
              height={{ min: '600px' }}
              width={{ min: '500px' }}
              round="small"
              justify="between"
            >
              {children}
            </Box>
          </animated.div>
        </Box>}
    </>
  );
}

CenterPanelWrap.defaultProps = { basis: undefined };
export default CenterPanelWrap;

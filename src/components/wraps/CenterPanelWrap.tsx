import React, { useContext, useRef, useState } from 'react';
import { Box, ResponsiveContext, Stack } from 'grommet';
import { UserContext } from '../../contexts/UserContext';

import { useSpring, animated, to } from 'react-spring';
import { useGesture } from 'react-use-gesture';
import styled from 'styled-components';

interface IPanelWrap {
  children: any;
  series?: any;
  showBorder?: boolean;
}

const StyledBox: any = styled(Box)`
  ${(props: any) => props.startColor}
  ${(props: any) => props.endColor}
  background: ${(props: any) => props.startColor}; /* Old browsers */
  background: -moz-linear-gradient(
    top,
    ${(props: any) => props.startColor} 0%,
    ${(props: any) => props.endColor} 100%
  ); /* FF3.6-15 */
  background: -webkit-linear-gradient(
    top,
    ${(props: any) => props.startColor} 0%,
    ${(props: any) => props.endColor} 100%
  ); /* Chrome10-25,Safari5.1-6 */
  background: linear-gradient(
    to bottom,
    ${(props: any) => props.startColor} 0%,
    ${(props: any) => props.endColor} 100%
  ); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
  filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='${(props: any) =>
    props.startColor}', endColorstr='${(props: any) => props.endColor}',GradientType=1 );
  filter: blur(75px);
`;

const calcX = (y: number, ly: number) => -(y - ly - window.innerHeight / 2) / 300;
const calcY = (x: number, lx: number) => (x - lx - window.innerWidth / 2) / 300;

function CenterPanelWrap({ children, series, showBorder }: IPanelWrap) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const { userState } = useContext(UserContext);
  const { selectedVR } = userState;

  console.log('centerpanelwrap', children, series, showBorder);

  const [flipped] = useState(false);
  const domTarget = useRef(null);
  const [{ x, y, rotateX, rotateY, rotateZ, zoom, scale, transform, opacity }, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    zoom: 0,
    x: 0,
    y: 0,
    config: { mass: 5, tension: 500, friction: 80 },
    opacity: flipped ? 1 : 0,
    transform: `perspective(600px) rotateX(${flipped ? 180 : 0}deg)`,
  }));

  useGesture(
    {
      onMove: ({ xy: [px, py], dragging }) =>
        !dragging &&
        api.start({
          rotateX: calcX(py, y.get()),
          rotateY: calcY(px, x.get()),
          scale: 1.0,
        }),
      onHover: ({ hovering }) => !hovering && api.start({ rotateX: 0, rotateY: 0, scale: 1 }),
    },
    { domTarget, eventOptions: { passive: false } }
  );

  return (
    <>
      {mobile ? (
        <Box ref={domTarget} height="100%" margin={{ top: mobile ? 'xlarge' : undefined }}>
          {children}
        </Box>
      ) : (
        <Box align="center" justify="center">
          <animated.div
            ref={domTarget}
            style={{
              transform,
              x,
              y,
              scale: to([scale, zoom], (s, z) => s + z),
              rotateX,
              rotateY,
              rotateZ,
              opacity: opacity.to((o: any) => 1 - o),
            }}
          >
            <Stack anchor="center">
              {series && (
                <Box
                  height="650px"
                  width="500px"
                  align="center" // use this to move shadow around
                  justify="end" // use this to move shadow around
                >
                  <StyledBox
                    height="500px"
                    width="450px"
                    startColor={series.startColor}
                    endColor={series.endColor}
                    animation="fadeIn"
                  />
                </Box>
              )}
              <Box
                elevation={mobile || selectedVR ? undefined : 'xlarge'}
                height="650px"
                width="500px"
                round="medium"
                background="lightBackground"
                style={
                  showBorder && selectedVR
                    ? {
                        borderImage:
                          'linear-gradient(to right, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82) 1',
                        borderWidth: '10px',
                        borderStyle: 'solid',
                        borderRadius: '10px',
                      }
                    : {}
                }
              >
                <Box fill round="xsmall" background="lightBackground" justify="between">
                  {children}
                </Box>
              </Box>
            </Stack>
          </animated.div>
        </Box>
      )}
    </>
  );
}

CenterPanelWrap.defaultProps = { series: undefined };
export default CenterPanelWrap;

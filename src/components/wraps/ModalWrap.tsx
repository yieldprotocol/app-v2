import React, { useContext, useRef, useState } from 'react';
import { Box, Button, Grid, Header, Heading, Layer, ResponsiveContext, Text } from 'grommet';
import styled from 'styled-components';

import { FiX } from 'react-icons/fi';

import { useSpring, animated, to, a } from 'react-spring';
import { useGesture } from 'react-use-gesture';
import MainViewWrap from './MainViewWrap';
import PanelWrap from './PanelWrap';
import YieldLogo from '../logos/YieldLogo';
import BackButton from '../buttons/BackButton';
import CenterPanelWrap from './CenterPanelWrap';

interface IModalWrap {
  modalOpen: boolean;
  toggleModalOpen: () => void;
  children: any;
  background?: string | undefined;
}

// const BlurredLayer = styled.Layer()`

// `;

const calcX = (y: number, ly: number) => -(y - ly - window.innerHeight / 2) / 200;
const calcY = (x: number, lx: number) => (x - lx - window.innerWidth / 2) / 200;

function ModalWrap({ children, toggleModalOpen, background, modalOpen = false }: IModalWrap) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const [flipped, setFlipped] = useState(false);

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
    <Box>
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
        {modalOpen && (
          <Layer
            // plain
            onClickOutside={() => toggleModalOpen()}
            responsive
            full
            background={background}
            animation="none"
          >
            <Header
              pad="medium"
              height={mobile ? undefined : 'xsmall'}
              justify="between"
              fill="horizontal"
              style={{ position: 'fixed', top: '0px' }}
            >
              <YieldLogo height={mobile ? '1em' : '1.5em'} startcolor='white' endcolor='red' />
              <FiX onClick={() => toggleModalOpen()} />
            </Header>

            <Box flex={!mobile} overflow="auto" margin={{ top: 'xlarge' }}>
              <MainViewWrap pad="large">
                <PanelWrap>
                  <Box />
                </PanelWrap>
                <Box gap="large" width="600px" pad={{ top: 'large' }}>
                  {/* <BackButton action={() => toggleModalOpen()} /> */}
                  {children}
                </Box>
                <PanelWrap>
                  {' '}
                  <Box />{' '}
                </PanelWrap>
              </MainViewWrap>
            </Box>
          </Layer>
        )}
      </animated.div>
    </Box>
  );
}

ModalWrap.defaultProps = { background: undefined };

// ModalWrap.defaultProps = { basis: undefined };
export default ModalWrap;

import React, { useContext, useRef, useState } from 'react';
import { Avatar, Image, Box, Button, Heading, Layer, ResponsiveContext, Text } from 'grommet';

import { useSpringRef, useSpring, animated, to, a } from 'react-spring';
import { useGesture } from 'react-use-gesture';
import Vault from '../../views/Vault';
import { IUserContext, IVault } from '../../types';
import { UserContext } from '../../contexts/UserContext';

interface IVaultWrap {
  vault: IVault
  index:number
}

const calcX = (y: number, ly: number) => -(y - ly - window.innerHeight / 2) / 400;
const calcY = (x: number, lx: number) => (x - lx - window.innerWidth / 2) / 400;

function VaultWrap({ vault, index }: IVaultWrap) {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const [expanded, setExpanded] = useState(false);

  // const domTarget = useRef(null);
  // const [{ x, y, rotateX, rotateY, rotateZ, zoom, scale, transform, opacity }, api] = useSpring(
  //   () => ({
  //     rotateX: 0,
  //     rotateY: 0,
  //     rotateZ: 0,
  //     scale: 1,
  //     zoom: 0,
  //     x: 0,
  //     y: 0,
  //     config: { mass: 5, tension: 500, friction: 80 },
  //     opacity: flipped ? 1 : 0,
  //     transform: `perspective(600px) rotateX(${flipped ? 180 : 0}deg)`,
  //   }),
  // );

  // useGesture(
  //   {
  //     onMove: ({ xy: [px, py], dragging }) => !dragging &&
  //       api.start({
  //         rotateX: calcX(py, y.get()),
  //         rotateY: calcY(px, x.get()),
  //         scale: 1.00,
  //       }),
  //     onHover: ({ hovering }) => !hovering && api.start({ rotateX: 0, rotateY: 0, scale: 1 }),
  //   },
  //   { domTarget, eventOptions: { passive: false } },
  // );

  return (

    <Box
      direction="row"
      animation={{ type: 'fadeIn', delay: index * 100, duration: 1500 }}
      hoverIndicator={{ elevation: 'large' }}
      round="small"
      onClick={() => setExpanded(true)}
      gap="xsmall"
      pad="xsmall"
    >
      <Avatar background="accent-2" size="small"> v</Avatar>
      <Text size="small">{vault.id} </Text>
      {
        expanded &&
          <Layer
            onClickOutside={() => setExpanded(false)}
            modal
          >
            <Box
              pad="large"
              width="600px"
              height="600px"
              round="small"
              background="white"
            >
              <Vault />
            </Box>
          </Layer>
      }
    </Box>

  );
}

export default VaultWrap;

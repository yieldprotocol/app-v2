import React, { useContext } from 'react';
import { Box, Layer, ResponsiveContext } from 'grommet';
import styled from 'styled-components';

function ActionButtonGroup({ ...props }:any) {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');

  return (
    mobile ? (
      <Layer
        position="bottom"
        modal={false}
        responsive={false}
        full="horizontal"
        animate={false}
      >
        <Box gap="small" fill="horizontal" pad="small">
          { props.children }
        </Box>
      </Layer>)
      :
      <Box gap="small" fill="horizontal">
        {props.children}
      </Box>
  );
}

export default ActionButtonGroup;

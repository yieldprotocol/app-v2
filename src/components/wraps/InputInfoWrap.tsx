import React from 'react';
import { Box, Text } from 'grommet';
import { FiInfo, FiPlayCircle } from 'react-icons/fi';
import styled from 'styled-components';
import BoxWrap from './BoxWrap';

function InputInfoWrap({ action, index, children }: { children: any; index?: number; action?: () => void }) {
  return (

        <BoxWrap
          pad='small'
          direction="row"
          gap="small"
          align="center"
          animation= { action? undefined : "zoomIn"}
          onClick={action ? () => action() : undefined}
          fill='horizontal'
        >
          {action?  <FiPlayCircle size="1.25rem" color="green" /> :   <FiInfo size="1.25rem" color="orange" />}
          {children}
        </BoxWrap>
  );
}

InputInfoWrap.defaultProps = { index: 0, action: undefined };

export default InputInfoWrap;

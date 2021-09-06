import React from 'react';
import { Box, Text } from 'grommet';
import { FiInfo } from 'react-icons/fi';
import styled from 'styled-components';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;

  :hover {
    transform: scale(1.025);
  }
`;

function InputInfoWrap({ action, index, children }: { children: any; index?: number; action?: () => void }) {
  return (
      <Box 
        pad="small" 
        direction="row" 
        gap="small" 
        align="center" 
        animation="zoomIn"
        onClick={ action ? () => action(): undefined} 
        round='xsmall'
        // elevation='xsmall' 
        hoverIndicator={{ elevation:'xsmall' }}
      >
       <FiInfo  size='1.25rem' color='orange' />
       { children }
      </Box>
  );
}

InputInfoWrap.defaultProps = {index: 0, action: undefined }

export default InputInfoWrap;

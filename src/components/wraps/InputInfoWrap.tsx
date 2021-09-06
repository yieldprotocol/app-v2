import React from 'react';
import { Box, Text } from 'grommet';
import { FiInfo } from 'react-icons/fi';

function InputInfoWrap({ action, index, children }: { children: any; index?: number; action?: () => void }) {
  return (
      <Box 
        pad="small" 
        direction="row" 
        gap="small" 
        align="center" 
        animation="zoomIn"
        onClick={() => action && action()}      
      >
       <FiInfo  size='1.25rem' color='orange' />
       { children }
      </Box>
  );
}

InputInfoWrap.defaultProps = {index: 0, action: undefined }

export default InputInfoWrap;

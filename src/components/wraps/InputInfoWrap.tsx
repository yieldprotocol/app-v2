import React from 'react';
import { Box, Text } from 'grommet';
import { FiInfo, FiPlayCircle } from 'react-icons/fi';
import styled from 'styled-components';
import BoxWrap from './BoxWrap';

function InputInfoWrap({ action, index, children }: { children: any; index?: number; action?: () => void }) {
  return (
    <>
      {action ? (
        <BoxWrap
          pad={{ vertical: 'small' }}
          direction="row"
          gap="small"
          align="center"
          onClick={action ? () => action() : undefined}
        >
          <FiPlayCircle size="1.25rem" color="orange" />
          {children}
        </BoxWrap>
      ) : (
        <Box pad={{ vertical: 'small' }} direction="row" gap="small" align="center" animation="zoomIn">
          <FiInfo size="1.25rem" color="orange" />
          {children}
        </Box>
      )}
    </>
  );
}

InputInfoWrap.defaultProps = { index: 0, action: undefined };

export default InputInfoWrap;

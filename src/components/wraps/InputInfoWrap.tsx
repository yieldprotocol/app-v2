import React from 'react';
import { Box, Text } from 'grommet';
import { FiInfo, FiPlayCircle } from 'react-icons/fi';
import styled from 'styled-components';
import BoxWrap from './BoxWrap';

function InputInfoWrap({ action, index, children }: { children: any; index?: number; action?: () => void }) {
  return (
    <BoxWrap
      pad="xsmall"
      direction="row"
      align="center"
      animation={action ? undefined : 'zoomIn'}
      onClick={action ? () => action() : undefined}
      fill="horizontal"
    >
      {action ? (
        <Box>
          <FiPlayCircle size="1.2rem" color="#10B981" />
        </Box>
      ) : (
        <Box>
          <FiInfo size="1.2rem" color="#D97706" />
        </Box>
      )}
      <Box pad="small">{children}</Box>
    </BoxWrap>
  );
}

InputInfoWrap.defaultProps = { index: 0, action: undefined };

export default InputInfoWrap;

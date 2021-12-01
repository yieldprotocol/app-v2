import React, { useContext } from 'react';
import { Box, ThemeContext } from 'grommet';
import { FiInfo, FiPlayCircle } from 'react-icons/fi';
import BoxWrap from './BoxWrap';

function InputInfoWrap({ action, index, children }: { children: any; index?: number; action?: () => void }) {
  const theme = useContext<any>(ThemeContext);
  const { green, yellow } = theme.global.colors;
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
          <FiPlayCircle size="1.2rem" color={green} />
        </Box>
      ) : (
        <Box>
          <FiInfo size="1.2rem" color={yellow} />
        </Box>
      )}
      <Box pad="small">{children}</Box>
    </BoxWrap>
  );
}

InputInfoWrap.defaultProps = { index: 0, action: undefined };

export default InputInfoWrap;

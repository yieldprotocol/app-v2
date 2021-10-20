import React from 'react';
import { Box, Layer } from 'grommet';
import { FiX } from 'react-icons/fi';
import SeriesSelector from './SeriesSelector';
import { ActionType } from '../../types';

const SeriesSelectorModal = ({
  inputValue,
  actionType,
  open,
  setOpen,
}: {
  inputValue: string;
  actionType: ActionType;
  open: boolean;
  setOpen?: any;
}) => (
  <>
    {!open && (
      <Box onClick={() => setOpen(true)}>
        <SeriesSelector inputValue={inputValue} actionType={actionType} setOpen={setOpen} cardLayout={false} />
      </Box>
    )}
    {open && (
      <Layer>
        <Box gap="small" pad="medium">
          <Box alignSelf="end" onClick={() => setOpen(false)} pad="xsmall">
            <FiX size="1.5rem" />
          </Box>
          <SeriesSelector inputValue={inputValue} actionType={actionType} setOpen={setOpen} />
        </Box>
      </Layer>
    )}
  </>
);

SeriesSelectorModal.defaultProps = {
  setOpen: () => null,
};

export default SeriesSelectorModal;

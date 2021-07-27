import React, { useContext } from 'react';
import { Box, Text, ResponsiveContext } from 'grommet';
import { UserContext } from '../../contexts/UserContext';
import { IUserContext } from '../../types';

interface IMaxButtonProps {
  /* select series locally filters out the global selection from the list and returns the selected ISeries */
  action: () => void;
  clearAction?: () => void;
  showingMax?: boolean;
  disabled?: boolean;
}

function MaxButton({ action, clearAction, showingMax, disabled }: IMaxButtonProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  /* state from context */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount } = userState;

  return (
    <>
      {!mobile && activeAccount && (
        <Box
          onClick={!disabled && !showingMax ? () => action() : () => clearAction && clearAction()}
          pad="xsmall"
          round="xsmall"
          align="center"
          background="tailwind-lightest-blue"
          border={{ color: 'white' }}
          width="xxsmall"
        >
          <Text size="xsmall" color="brand">
            {showingMax ? 'Clear' : 'Max'}
          </Text>
        </Box>
      )}
    </>
  );
}

MaxButton.defaultProps = { disabled: false, clearAction: () => null, showingMax: false };

export default MaxButton;

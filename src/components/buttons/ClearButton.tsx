import React, { useContext } from 'react';
import { Box, Text, ResponsiveContext } from 'grommet';
import { UserContext } from '../../contexts/UserContext';
import { IUserContext } from '../../types';

interface IClearButtonProps {
  /* select series locally filters out the global selection from the list and returns the selected ISeries */
  action: () => void;
  disabled?: boolean;
}

function ClearButton({ action, disabled }: IClearButtonProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  /* state from context */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount } = userState;

  return (
    <>
      {!mobile && activeAccount && (
        <Box onClick={() => !disabled && action()} pad="xsmall">
          <Text size="xsmall" color={disabled ? 'text-xweak' : 'text'}>
            MAX
          </Text>
        </Box>
      )}
    </>
  );
}

ClearButton.defaultProps = { disabled: false };

export default ClearButton;

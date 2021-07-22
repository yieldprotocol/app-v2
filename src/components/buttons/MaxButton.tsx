import React, { useContext } from 'react';
import { Box, Text, ResponsiveContext } from 'grommet';
import { UserContext } from '../../contexts/UserContext';
import { IUserContext } from '../../types';

interface IMaxButtonProps {
  /* select series locally filters out the global selection from the list and returns the selected ISeries */
  action: () => void;
  disabled?: boolean;
}

function MaxButton({ action, disabled }: IMaxButtonProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  /* state from context */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount } = userState;

  return (
    <>
      {!mobile && activeAccount && (
        <Box
          onClick={() => !disabled && action()}
          pad="xsmall"
          round="xsmall"
          align="center"
          background="tailwind-lightest-blue"
          border={{ color: 'white' }}
        >
          <Text size="xsmall" color={disabled ? 'text-xweak' : 'brand'}>
            MAX
          </Text>
        </Box>
      )}
    </>
  );
}

MaxButton.defaultProps = { disabled: false };

export default MaxButton;

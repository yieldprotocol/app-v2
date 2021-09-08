import React, { useContext } from 'react';
import styled from 'styled-components';
import { Box, Text, ResponsiveContext } from 'grommet';
import { UserContext } from '../../contexts/UserContext';
import { IUserContext } from '../../types';

interface IMaxButtonProps {
  /* select series locally filters out the global selection from the list and returns the selected ISeries */
  action: () => void;
  clearAction?: () => void;
  showingMax?: boolean;
  disabled?: boolean;
  customText?: string;
}

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;

  padding: 0;
  :hover {
    transform: scale(1.1);
  }
  :active {
    transform: scale(1);
  }
`;

function MaxButton({ action, clearAction, showingMax, disabled, customText }: IMaxButtonProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  /* state from context */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount } = userState;

  return (
    <>
      {activeAccount && (
        <StyledBox
          onClick={!disabled && !showingMax ? () => action() : () => clearAction && clearAction()}
          pad="xsmall"
          round="xsmall"
          align="center"
          // border={{ color: 'white' }}
          width="xxsmall"
        >
          <Text size="xsmall" color={disabled ? 'text-xweak' : 'text-weak'}>
            {showingMax ? 'Clear' : customText || 'Max' }
          </Text>
        </StyledBox>
      )}
    </>
  );
}

MaxButton.defaultProps = { disabled: false, clearAction: () => null, showingMax: false , customText: undefined};

export default MaxButton;

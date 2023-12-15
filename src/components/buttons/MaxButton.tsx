import styled from 'styled-components';
import { Box, Text } from 'grommet';
import { useAccount } from 'wagmi';

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

  const { address: activeAccount } = useAccount();

  return (
    <>
      {activeAccount && (
        <StyledBox
          onClick={!disabled && !showingMax ? () => action() : () => clearAction && clearAction()}
          pad="xsmall"
          round
          align="center"
          width="xxsmall"
        >
          <Text size="xsmall" color={disabled ? 'text-weak' : 'text'}>
            {showingMax ? 'Clear' : customText || 'Max'}
          </Text>
        </StyledBox>
      )}
    </>
  );
}

MaxButton.defaultProps = { disabled: false, clearAction: () => null, showingMax: false, customText: undefined };

export default MaxButton;

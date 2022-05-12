import { Box, Button, Text } from 'grommet';
import { FiAlertTriangle } from 'react-icons/fi';
import styled from 'styled-components';
import { useColorScheme } from '../../hooks/useColorScheme';

const StyledButton = styled(Button)`
  -webkit-transition: transform 0.2s ease-in-out;
  -moz-transition: transform 0.2s ease-in-out;
  transition: transform 0.2s ease-in-out;

  border: 2px solid transparent;
  border-radius: 100px;

  background: ${(props: any) =>
    props.errorLabel
      ? `linear-gradient(${props.background},${props.background}) padding-box, #F87171 border-box`
      : `linear-gradient(${props.background}, ${props.background}) padding-box, -webkit-linear-gradient(135deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82) border-box`};

  :hover:enabled {
    transform: scale(1.02);
    box-shadow: none;
    background: -webkit-linear-gradient(
      135deg,
      #f7953380,
      #f3705580,
      #ef4e7b80,
      #a166ab80,
      #5073b880,
      #1098ad80,
      #07b39b80,
      #6fba8280
    );
  }

  :active:enabled {
    transform: scale(1);
  }

  :disabled {
    transform: scale(0.9);
    opacity: ${(props: any) => (props.errorLabel ? '0.8 !important' : '0.2 !important')};
  }
`;

const NextButton = (props: any) => {
  const theme = useColorScheme();

  return (
    <Box>
      <StyledButton
        {...props}
        color={props.errorLabel ? 'red' : undefined}
        background={theme === 'dark' ? '#181818' : '#FEFEFE'}
        label={
          props.errorLabel ? (
            <Box direction="row" gap="small" align="center" fill justify="center">
              <Text color="red">
                <FiAlertTriangle style={{ verticalAlign: 'middle' }} />
              </Text>
              <Text color="red" size="xsmall">
                {props.errorLabel}
              </Text>
            </Box>
          ) : (
            <Box>
              <Text color="text"> {props.label} </Text>
            </Box>
          )
        }
      />
    </Box>
  );
};

export default NextButton;

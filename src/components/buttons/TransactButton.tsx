import { Box, Button } from 'grommet';
import styled from 'styled-components';

const StyledButton = styled(Button)`

  -webkit-transition: transform 0.2s ease-in-out;
  -moz-transition: transform 0.2s ease-in-out;
  transition: transform 0.2s ease-in-out;

  /* height: ${(props: any) => (props.mobile ? '3rem' : '3rem')}; */
  border: ${(props) => (props.theme.dark ? '2px solid #141a1e' : '2px solid white')};

  border-radius: 100px;

  :hover:enabled {
    transform: scale(1.01);
    border: 2px solid #ffffff00;
  }

  :active:enabled {
    transform: scale(1);
  }

  :disabled {
    transform: scale(0.90);
  }

`;

const TransactButton = (props: any) => (
  <Box gap="xsmall">
    {props.confirmationElement}
    <StyledButton {...props} color="gradient" />
  </Box>
);

export default TransactButton;

import { useContext } from 'react';
import { Text } from 'grommet';
import styled, { ThemeContext } from 'styled-components';

const StyledText = styled(Text)`
  font-family: 'Raleway';
  background: -webkit-linear-gradient(95deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: ${(props) => (props.theme.dark ? 'drop-shadow(2px 2px 2px #141a1e)}' : 'drop-shadow(2px 2px 2px #ddd)')};
`;

const ColorText = (props: any) => {
  const theme = useContext(ThemeContext);
  return (
    <StyledText {...props} selected={props.selected} theme={theme}>
      {props.children}
    </StyledText>
  );
};

export default ColorText;

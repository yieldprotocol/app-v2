import { Text } from 'grommet';
import styled from 'styled-components';

const StyledText = styled(Text)`
  font-family: 'Raleway';
`;

const AltText = (props: any) => <StyledText {...props}>{props.children}</StyledText>;

export default AltText;

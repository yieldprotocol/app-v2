import { Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';

// font-family: 'Rubik';
// font-family: 'Neucha', cursive;
// font-family: 'Tourney';

//  font-family: 'Vast Shadow';
// font-family: 'Faster One';
// font-family: 'Monoton';

const StyledText = styled(Text)`
  font-family: 'Raleway';
  font-weight: 900;
  font-style: italic;
`;

const HandText = (props: any) => <StyledText {...props}>{props.children}</StyledText>;

export default HandText;

import { Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';

// font-family: 'Rubik';
// font-family: 'Neucha', cursive;

const StyledText = styled(Text)`
  font-family: 'Rubik';
`;

const HandText = (props: any) => <StyledText {...props}>{props.children}</StyledText>;

export default HandText;

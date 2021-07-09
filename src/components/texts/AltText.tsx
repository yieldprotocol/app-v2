import { Text } from 'grommet';
import React from 'react';
import styled from 'styled-components';

const StyledText = styled(Text)`
  font-family: 'Rubik';
`;

const AltText = (props: any) => <StyledText {...props}>{props.children}</StyledText>;

export default AltText;

import React from 'react';
import { Text } from 'grommet';
import styled from 'styled-components';

const StyledText = styled(Text)`
  font-family: 'Raleway';
  background: -webkit-linear-gradient(95deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82);
  -webkit-background-clip: text; 
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(2px 2px 2px #ddd);  */
`;

const ColorText = (props: any) => <StyledText {...props} selected={props.selected}>{props.children}</StyledText>;

export default ColorText;

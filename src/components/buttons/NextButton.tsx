import { Box, Button, Text } from 'grommet';
import React, { useState } from 'react';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  /* height: ${(props: any) => (props.mobile ? '2em' : '4.5em')}; */
`;

const NextButton = (props: any) => (
  <Box>
    <StyledButton {...props} />
  </Box>
);

export default NextButton;

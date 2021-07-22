import { Box, Button, Text } from 'grommet';
import React, { useState } from 'react';
import styled from 'styled-components';

const StyledButton = styled(Button)``;

const NextButton = (props: any) => (
  <Box>
    <StyledButton {...props} />
  </Box>
);

export default NextButton;

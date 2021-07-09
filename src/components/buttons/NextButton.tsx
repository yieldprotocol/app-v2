import { Box, Button, Text } from 'grommet';
import React, { useState } from 'react';
import styled from 'styled-components';

const StyledButton = styled(Button)``;

const NextButton = (props: any) => (
  <Box pad="large">
    <StyledButton {...props} />
  </Box>
);

export default NextButton;

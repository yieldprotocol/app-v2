import React from 'react';
import { Box, Text } from 'grommet';

const PlaceholderWrap = ({ label }:{ label: String }) => (
  <Box pad="xsmall">
    <Text color="text" size="small"> { label } </Text>
  </Box>
);

export default PlaceholderWrap;

import React from 'react';
import { Box, Text } from 'grommet';

const PlaceholderWrap = ({ label, disabled }: { label: string; disabled?: boolean }) => (
  <Box pad="xsmall">
    <Text color={disabled ? 'text-xweak' : 'text'} size="small">
      {' '}
      {label}{' '}
    </Text>
  </Box>
);

PlaceholderWrap.defaultProps = { disabled: false };
export default PlaceholderWrap;

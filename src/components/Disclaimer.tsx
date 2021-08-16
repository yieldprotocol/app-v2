import React from 'react';
import { Box, CheckBox, Text } from 'grommet';
import SectionWrap from './wraps/SectionWrap';

const Disclaimer = ({ checked, onChange }: { checked: boolean; onChange: any }) => (
  <SectionWrap>
    <Box pad="small" justify="between" direction="row" gap="small">
      <CheckBox checked={checked} onChange={onChange} />
      <Text size="xsmall">disclaimer example: I understand the terms of transactions.</Text>
    </Box>
  </SectionWrap>
);

export default Disclaimer;

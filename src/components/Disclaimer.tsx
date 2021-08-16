import React from 'react';
import { Box, CheckBox, Text } from 'grommet';
import SectionWrap from './wraps/SectionWrap';

const Disclaimer = ({ checked, onChange }: { checked: boolean; onChange: any }) => (
  <SectionWrap>
    <Box pad={{ horizontal: 'large', vertical: 'small' }}>
      <CheckBox
        label={<Text size="xsmall">disclaimer example: I understand the terms of transactions.</Text>}
        checked={checked}
        onChange={onChange}
      />
    </Box>
  </SectionWrap>
);

export default Disclaimer;

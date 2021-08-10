import React from 'react';
import { Box, CheckBox, Text } from 'grommet';
import SectionWrap from './wraps/SectionWrap';

const Disclaimer = ({ checked, setChecked }: { checked: boolean; setChecked: any }) => (
  <SectionWrap>
    <Box pad={{ horizontal: 'large', vertical: 'small' }}>
      <CheckBox
        label={<Text size="xsmall">disclaimer example: I understand the terms of transactions.</Text>}
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
      />
    </Box>
  </SectionWrap>
);

export default Disclaimer;

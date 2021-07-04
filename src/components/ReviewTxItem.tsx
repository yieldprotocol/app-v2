import { Box, Text } from 'grommet';
import React from 'react';

function ReviewTxItem({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <Box
      direction="row"
      align="center"
      pad={{ left: 'small', vertical: 'none' }}
      gap="medium"
    >
      <Text size="1.5em">{icon}</Text>
      <Box>
        <Text size="xsmall" color="text-weak">{label}</Text>
        <Text size="small"> {value} </Text>
      </Box>

    </Box>
  );
}

export default ReviewTxItem;

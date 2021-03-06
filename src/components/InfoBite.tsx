import { Box, Text } from 'grommet';
import React from 'react';

interface IInfoBite {
  label: string;
  value: string;
}
const InfoBite = ({ label, value }: IInfoBite) => (
  <Box>
    <Text size="small" color="text-weak" style={{ textDecoration: 'underline' }}> {label}</Text>
    <Text size="small" color="text-weak"> {value}</Text>
  </Box>);

export default InfoBite;

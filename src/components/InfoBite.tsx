import { Box, ResponsiveContext, Text } from 'grommet';
import React, { useContext } from 'react';

interface IInfoBite {
  label: string;
  value: string;
}
const InfoBite = ({ label, value }: IInfoBite) => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  return (
    <Box direction={mobile ? 'row' : undefined} justify={mobile ? 'between' : undefined}>
      <Text size={mobile ? 'xsmall' : 'small'} color="text-weak" style={{ textDecoration: 'underline' }}> {label}</Text>
      <Text size={mobile ? 'xsmall' : 'small'} color="text-weak"> {value}</Text>
    </Box>);
};

export default InfoBite;

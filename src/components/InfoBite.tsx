import { Box, ResponsiveContext, Text } from 'grommet';
import React, { useContext } from 'react';

interface IInfoBite {
  label: string;
  value: string;
}
const InfoBite = ({ label, value }: IInfoBite) => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  return (
    <Box direction="row" justify={mobile ? 'between' : undefined} gap="small">
      <Text weight="bold" size={mobile ? 'xsmall' : 'small'} color="text-weak"> {label}</Text>
      <Text size={mobile ? 'xsmall' : 'small'} color="text"> {value}</Text>
    </Box>);
};

export default InfoBite;

import { Box, ResponsiveContext, Text } from 'grommet';
import React, { useContext } from 'react';

interface IInfoBite {
  label: string;
  value: string;
  icon?: any;
}

const InfoBite = ({ label, value, icon }: IInfoBite) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  return (
    <Box direction="row" align="center" pad={{ left: 'small', vertical: 'none' }} gap="medium">
      {icon && <Text size="1.5em">{icon}</Text>}
      <Box>
        <Text size="xsmall" color="text-weak">
          {label}
        </Text>
        <Text size="medium"> {value} </Text>
      </Box>
    </Box>
  );
};

InfoBite.defaultProps = { icon: undefined };

export default InfoBite;

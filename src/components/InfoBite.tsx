import { Box, ResponsiveContext, Text } from 'grommet';
import React, { useContext } from 'react';

interface IInfoBite {
  label: string;
  value: string;
  icon?: any;
}

// const iconMap = new Map([
//   [ 'borrow': ],
//   [ 'borrow': ],
//   [ 'borrow': ],
//   [ 'borrow': ],
//   [ 'borrow': ],

// ])

const InfoBite = ({ label, value, icon }: IInfoBite) => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  return (
    <Box
      direction="row"
      align="center"
      pad={{ left: 'small', vertical: 'none' }}
      gap="medium"
    >
      {icon && <Text size="1.5em">{icon}</Text>}
      <Box>
        <Text size="xsmall" color="text-weak">{label}</Text>
        <Text size="small"> {value} </Text>
      </Box>
    </Box>

  // <Box direction="row" justify={mobile ? 'between' : undefined} gap="small">
  //   <Text weight="bold" size={mobile ? 'xsmall' : 'small'} color="text-weak"> {label}</Text>
  //   <Text size={mobile ? 'xsmall' : 'small'} color="text"> {value}</Text>
  // </Box>
  );
};

InfoBite.defaultProps = { icon: undefined };

export default InfoBite;

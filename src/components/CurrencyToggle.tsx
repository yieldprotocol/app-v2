import React, { useContext } from 'react';
import { Box, Text } from 'grommet';
import { UserContext } from '../contexts/UserContext';

const CurrencyToggle = (props: any) => {
  const {
    userState: { currencySetting },
    userActions: { setCurrencySetting },
  } = useContext(UserContext);

  return (
    <Box gap="small">
      <Text size="small">Show Summary in:</Text>
      <Box width={props.width}>
        <Box direction="row" align="center" justify="center">
          <Box
            fill
            pad="small"
            background={currencySetting === 'DAI' ? 'tailwind-blue' : 'tailwind-blue-100'}
            round={{ corner: 'left', size: 'xsmall' }}
            onClick={() => setCurrencySetting('DAI')}
            align="center"
          >
            <Text size="small">DAI</Text>
          </Box>
          <Box
            fill
            pad="small"
            background={currencySetting === 'ETH' ? 'tailwind-blue' : 'tailwind-blue-100'}
            round={{ corner: 'right', size: 'xsmall' }}
            onClick={() => setCurrencySetting('ETH')}
            align="center"
          >
            <Text size="small">ETH</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CurrencyToggle;

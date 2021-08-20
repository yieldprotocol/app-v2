import React, { useContext } from 'react';
import { Box, Text } from 'grommet';
import { UserContext } from '../contexts/UserContext';

const CurrencyToggle = () => {
  const {
    userState: { currencySetting },
    userActions: { setCurrencySetting },
  } = useContext(UserContext);

  return (
    <Box gap="small">
      <Text size="small">Show Summary in:</Text>
      <Box
        direction="row"
        border={{ color: 'tailwind-blue' }}
        round="xsmall"
        width="50%"
        align="center"
        justify="center"
      >
        <Box
          pad="small"
          background={currencySetting === 'DAI' ? 'tailwind-blue-50' : undefined}
          round="xsmall"
          onClick={() => setCurrencySetting('DAI')}
        >
          <Text size="small">DAI</Text>
        </Box>
        <Box
          pad="small"
          background={currencySetting === 'ETH' ? 'tailwind-blue-50' : undefined}
          round="xsmall"
          onClick={() => setCurrencySetting('ETH')}
        >
          <Text size="small">ETH</Text>
        </Box>
      </Box>
    </Box>
  );
};

export default CurrencyToggle;

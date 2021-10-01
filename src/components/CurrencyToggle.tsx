import React, { useContext } from 'react';
import { Box, Text } from 'grommet';
import { UserContext } from '../contexts/UserContext';

const CurrencyToggle = () => {
  const {
    userState: {
      dashSettings: { currencySetting },
    },
    userActions: { setDashSettings },
  } = useContext(UserContext);

  return (
    <Box direction="row" align="center" justify="center">
      <Box
        fill
        pad="small"
        background={currencySetting === 'DAI' ? 'tailwind-blue' : 'tailwind-blue-100'}
        round={{ corner: 'left', size: 'xsmall' }}
        onClick={() => setDashSettings('currencySetting', 'DAI')}
        align="center"
        justify="center"
      >
        <Text size="xsmall">USD</Text>
      </Box>
      <Box
        fill
        pad="small"
        background={currencySetting === 'ETH' ? 'tailwind-blue' : 'tailwind-blue-100'}
        round={{ corner: 'right', size: 'xsmall' }}
        onClick={() => setDashSettings('currencySetting', 'ETH')}
        align="center"
        justify="center"
      >
        <Text size="xsmall">ETH</Text>
      </Box>
    </Box>
  );
};

export default CurrencyToggle;

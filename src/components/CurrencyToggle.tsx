import React, { useContext } from 'react';
import { Box, Text } from 'grommet';
import { SettingsContext } from '../contexts/SettingsContext';
import { ISettingsContext } from '../types';

const CurrencyToggle = () => {
  const {
    settingsState: { dashCurrency },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext) as ISettingsContext;

  return (
    <Box direction="row" align="center" justify="center">
      <Box
        fill
        pad="small"
        background={dashCurrency === 'DAI' ? 'tailwind-blue' : 'tailwind-blue-100'}
        round={{ corner: 'left', size: 'xsmall' }}
        onClick={() => updateSetting('dashCurrency', 'DAI')}
        align="center"
        justify="center"
      >
        <Text size="xsmall">USD</Text>
      </Box>
      <Box
        fill
        pad="small"
        background={dashCurrency === 'ETH' ? 'tailwind-blue' : 'tailwind-blue-100'}
        round={{ corner: 'right', size: 'xsmall' }}
        onClick={() => updateSetting('dashCurrency', 'ETH')}
        align="center"
        justify="center"
      >
        <Text size="xsmall">ETH</Text>
      </Box>
    </Box>
  );
};

export default CurrencyToggle;

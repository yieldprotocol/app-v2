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
        border={dashCurrency === 'DAI' ? undefined : { color: 'lightgrey' }}
        background={dashCurrency === 'DAI' ? 'gradient-transparent' : undefined}
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
        border={dashCurrency === 'ETH' ? undefined : { color: 'lightgrey' }}
        background={dashCurrency === 'ETH' ? 'gradient-transparent' : undefined}
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

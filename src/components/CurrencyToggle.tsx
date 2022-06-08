import { useContext } from 'react';
import { Box, Text } from 'grommet';
import { Settings, SettingsContext } from '../contexts/SettingsContext';
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
        // border={dashCurrency === 'USDC' ? undefined : { color: 'lightgrey' }}
        background={dashCurrency === 'USDC' ? 'gradient-transparent' : undefined}
        round={{ corner: 'left' }}
        onClick={() => updateSetting(Settings.DASH_CURRENCY, 'USDC')}
        align="center"
        justify="center"
        elevation={dashCurrency === 'USDC' ? 'xsmall' : 'small'}
      >
        <Text size="xsmall">USD</Text>
      </Box>
      <Box
        fill
        pad="small"
        // border={dashCurrency === 'ETH' ? undefined : { color: 'lightgrey' }}
        background={dashCurrency === 'ETH' ? 'gradient-transparent' : undefined}
        round={{ corner: 'right' }}
        onClick={() => updateSetting(Settings.DASH_CURRENCY, 'ETH')}
        align="center"
        justify="center"
        elevation={dashCurrency === 'ETH' ? 'xsmall' : 'small'}
      >
        <Text size="xsmall">ETH</Text>
      </Box>
    </Box>
  );
};

export default CurrencyToggle;

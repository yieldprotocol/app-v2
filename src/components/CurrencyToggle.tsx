import { useContext } from 'react';
import { Box, Text } from 'grommet';
import { SettingsContext } from '../contexts/SettingsContext';
import { Settings } from '../contexts/types/settings';
import { USDC, WETH } from '../config/assets';

const CurrencyToggle = () => {
  const {
    settingsState: { dashCurrency },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  return (
    <Box direction="row" align="center" justify="center">
      <Box
        fill
        pad="small"
        background={dashCurrency === USDC ? 'gradient-transparent' : undefined}
        round={{ corner: 'left' }}
        onClick={() => updateSetting(Settings.DASH_CURRENCY, USDC)}
        align="center"
        justify="center"
        elevation={dashCurrency === USDC ? 'xsmall' : 'small'}
      >
        <Text size="xsmall">USD</Text>
      </Box>
      <Box
        fill
        pad="small"
        background={dashCurrency === WETH ? 'gradient-transparent' : undefined}
        round={{ corner: 'right' }}
        onClick={() => updateSetting(Settings.DASH_CURRENCY, WETH)}
        align="center"
        justify="center"
        elevation={dashCurrency === WETH ? 'xsmall' : 'small'}
      >
        <Text size="xsmall">ETH</Text>
      </Box>
    </Box>
  );
};

export default CurrencyToggle;

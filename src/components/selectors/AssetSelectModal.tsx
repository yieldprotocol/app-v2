import { ethers } from 'ethers';
import { Box, Button, Layer, ResponsiveContext, Text } from 'grommet';
import { useContext } from 'react';
import { FiX } from 'react-icons/fi';
import { useColorScheme } from '../../hooks/useColorScheme';
import { IAsset } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import Line from '../elements/Line';
import Logo from '../logos/Logo';
import BoxWrap from '../wraps/BoxWrap';

interface IAssetSelectModalProps {
  assets: IAsset[];
  handleSelect: (asset: IAsset) => void;
  open: boolean;
  setOpen: any;
}

const AssetSelectModal = ({ assets, handleSelect, open, setOpen }: IAssetSelectModalProps) => {
  const theme = useColorScheme();
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return open ? (
    <Layer
      onEsc={() => setOpen(false)}
      onClickOutside={() => setOpen(false)}
      style={{ minWidth: mobile ? undefined : '500px', borderRadius: '12px' }}
    >
      <Box background="background" round="12px">
        <Box
          direction="row"
          justify="between"
          align="center"
          pad="medium"
          background="gradient-transparent"
          round={{ corner: 'top', size: 'small' }}
        >
          <Text size="small">Select Collateral</Text>
          <Box onClick={() => setOpen(false)}>
            <FiX size="1.5rem" />
          </Box>
        </Box>

        <Line />

        <Box width="550px">
          <Box overflow="auto" height={{ max: '600px' }} pad={{ vertical: 'small', horizontal: 'large' }} gap="small">
            {assets
              .sort((a, b) => (a.balance?.lt(b.balance!) ? 1 : -1))
              .map((a) => (
                <Button
                  key={a.id}
                  onClick={() => {
                    handleSelect(a);
                    setOpen(false);
                  }}
                  disabled={a.balance && a.balance.eq(ethers.constants.Zero)}
                >
                  <BoxWrap
                    justify="between"
                    direction="row"
                    align="center"
                    pad={{ horizontal: 'large', vertical: 'small' }}
                    round="large"
                    elevation="xsmall"
                    hoverIndicator={theme === 'dark' ? 'hoverBackground' : 'background'}
                  >
                    <Box direction="row" gap="small" align="center">
                      <Logo image={a.image} />
                      <Box>
                        <Text size="medium">{a.displaySymbol}</Text>
                        <Text size="xsmall" color="text-weak">
                          {a.name}
                        </Text>
                      </Box>
                    </Box>
                    <Text size="small">{cleanValue(a.balance_, a.digitFormat)}</Text>
                  </BoxWrap>
                </Button>
              ))}
          </Box>
        </Box>
      </Box>
    </Layer>
  ) : null;
};

export default AssetSelectModal;

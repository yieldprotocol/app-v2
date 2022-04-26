import { ethers } from 'ethers';
import { Avatar, Box, Button, Layer, Text, ThemeContext } from 'grommet';
import { useContext } from 'react';
import { FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { useColorScheme } from '../../hooks/useColorScheme';
import { IAsset } from '../../types';

const Line = styled(Box)`
  width: 100%;
  height: 0.5px;
  background: ${(props) => props.color ?? '#262626'};
`;

interface IAssetSelectModalProps {
  assets: IAsset[];
  handleSelect: (asset: IAsset) => void;
  open: boolean;
  setOpen: any;
}

const AssetSelectModal = ({ assets, handleSelect, open, setOpen }: IAssetSelectModalProps) => {
  const theme = useColorScheme();
  const globalTheme = useContext<any>(ThemeContext);
  const { gradient } = globalTheme.global.colors;

  return open ? (
    <Layer animation="fadeIn" onEsc={() => setOpen(false)} onClickOutside={() => setOpen(false)}>
      <Box background="background" round="xsmall">
        <Box
          direction="row"
          justify="between"
          align="center"
          pad="medium"
          background="gradient-transparent"
          round={{ corner: 'top', size: 'xsmall' }}
        >
          <Text size="small">Select Collateral</Text>
          <Box onClick={() => setOpen(false)}>
            <FiX size="1.5rem" />
          </Box>
        </Box>

        <Line color={theme === 'dark' ? gradient.dark : gradient.light} />

        <Box width="medium">
          <Box overflow="auto" height={{ max: '500px' }}>
            {assets.map((a) => (
              <Button
                key={a.id}
                onClick={() => {
                  handleSelect(a);
                  setOpen(false);
                }}
                hoverIndicator={theme === 'dark' ? 'hoverBackground' : 'background'}
                disabled={a.balance.eq(ethers.constants.Zero)}
              >
                <Box justify="between" direction="row" align="center" pad={{ horizontal: 'medium', vertical: 'small' }}>
                  <Box direction="row" gap="small" align="center">
                    <Box height="24px" width="24px">
                      {a.image}
                    </Box>
                    <Box>
                      <Text size="small">{a.displaySymbol}</Text>
                      <Text size="xsmall" color="text-weak">
                        {a.name}
                      </Text>
                    </Box>
                  </Box>
                  <Text size="small">{a.balance_}</Text>
                </Box>
              </Button>
            ))}
          </Box>
        </Box>

        <Line color={theme === 'dark' ? gradient.dark : gradient.light} />

        <Box pad="medium" background="gradient-transparent" round={{ corner: 'bottom', size: 'xsmall' }} />
      </Box>
    </Layer>
  ) : null;
};

export default AssetSelectModal;

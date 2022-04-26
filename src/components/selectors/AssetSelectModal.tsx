import { Avatar, Box, Layer, Text, ThemeContext } from 'grommet';
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
        <Box direction="row" justify="between" align="center" pad="medium">
          <Text size="small">Select Collateral</Text>
          <Box onClick={() => setOpen(false)}>
            <FiX size="1.5rem" />
          </Box>
        </Box>

        <Line color={theme === 'dark' ? gradient.dark : gradient.light} />

        <Box width="medium">
          <Box overflow="auto" height="500px">
            {assets.map((a) => (
              <Box
                key={a.id}
                justify="between"
                direction="row"
                align="center"
                pad={{ horizontal: 'medium', vertical: 'xsmall' }}
                hoverIndicator={theme === 'dark' ? 'hoverBackground' : 'background'}
                onClick={() => {
                  handleSelect(a);
                  setOpen(false);
                }}
                fill
              >
                <Box direction="row" gap="small" align="center">
                  <Avatar size="xsmall" background={theme === 'dark' ? 'text' : undefined}>
                    {a.image}
                  </Avatar>
                  <Box>
                    <Text size="small">{a.displaySymbol}</Text>
                    <Text size="xsmall" color="text-weak">
                      {a.name}
                    </Text>
                  </Box>
                </Box>
                <Text size="small">{a.balance_}</Text>
              </Box>
            ))}
          </Box>
        </Box>

        <Line color={theme === 'dark' ? gradient.dark : gradient.light} />

        <Box pad="medium" />
      </Box>
    </Layer>
  ) : null;
};

export default AssetSelectModal;

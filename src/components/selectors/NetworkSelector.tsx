import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text } from 'grommet';
import styled from 'styled-components';
import { ChainContext } from '../../contexts/ChainContext';
import { SUPPORTED_CHAIN_IDS, CHAIN_INFO } from '../../config/chainData';
import { useNetworkSelect } from '../../hooks/useNetworkSelect';
import { IChainContext } from '../../types';
import ArbitrumLogo from '../logos/Arbitrum';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.025);
  }
`;

const NetworkSelector = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    chainState: {
      connection: { fallbackChainId },
    },
  } = useContext(ChainContext) as IChainContext;
  const currentChainInfo = CHAIN_INFO.get(fallbackChainId!);

  const [options, setOptions] = useState<string[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<number | undefined>();

  useNetworkSelect(selectedChainId!);

  const handleNetworkChange = (chainName: string) => {
    setSelectedChainId([...CHAIN_INFO.entries()].find(([id, chainInfo]: any) => chainInfo.name === chainName)![0]);
  };

  useEffect(() => {
    setOptions(
      SUPPORTED_CHAIN_IDS.filter(
        (chainId: number) =>
          ![
            fallbackChainId,
            4,
            42,
            69,
            // 421611
          ].includes(chainId)
      ) // filter out test networks and currently selected network
        .map((chainId: number) => CHAIN_INFO.get(chainId)?.name!)
    );
  }, [fallbackChainId]);

  if (!currentChainInfo || options.length < 1) return null;

  return (
    <StyledBox round="xsmall" elevation="xsmall" background="hoverBackground">
      <Select
        plain
        dropProps={{ round: 'xsmall' }}
        id="networkSelect"
        name="networkSelect"
        placeholder="Select Network"
        options={options}
        value={currentChainInfo.name}
        labelKey={currentChainInfo.name}
        valueLabel={
          <Box pad={mobile ? 'medium' : { vertical: '0.55em', horizontal: 'small' }}>
            <Text color="text" size="small">
              {currentChainInfo.name}
            </Text>
          </Box>
        }
        onChange={({ option }: any) => handleNetworkChange(option)}
        // eslint-disable-next-line react/no-children-prop
        children={(x: any) => (
          <Box pad={mobile ? 'medium' : 'small'} gap="xsmall" direction="row">
            <Text color="text" size="small">

            <ArbitrumLogo />
              {x}
            </Text>
          </Box>
        )}
      />
    </StyledBox>
  );
};

export default NetworkSelector;

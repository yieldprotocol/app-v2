import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text } from 'grommet';
import styled from 'styled-components';
import { ChainContext } from '../../contexts/ChainContext';
import { SUPPORTED_CHAIN_IDS, CHAIN_INFO } from '../../config/chainData';

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
      connection: { currentChainInfo },
    },
  } = useContext(ChainContext);

  const [options, setOptions] = useState<string[]>([]);

  const handleNetworkChange = (chainName: string) => {
    console.log('changing network', chainName);
  };

  useEffect(() => {
    setOptions(SUPPORTED_CHAIN_IDS.map((chainId: number) => CHAIN_INFO.get(chainId)?.name!));
  }, []);

  if (!currentChainInfo) return null;

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
            <Text color={currentChainInfo.color} size="small">
              {currentChainInfo.name}
            </Text>
          </Box>
        }
        onChange={({ option }: any) => handleNetworkChange(option)}
        // eslint-disable-next-line react/no-children-prop
        children={(x: any) => (
          <Box pad={mobile ? 'medium' : 'small'} gap="xsmall" direction="row">
            <Text color="text" size="small">
              {x}
            </Text>
          </Box>
        )}
      />
    </StyledBox>
  );
};

export default NetworkSelector;

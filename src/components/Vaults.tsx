import React from 'react';
import { Box, Text } from 'grommet';
import styled from 'styled-components';
import { IVault } from '../types';
import ListWrap from './wraps/ListWrap';
import VaultListItem from './VaultListItem';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;

  :hover {
    transform: scale(1.05);
  }
  :active {
    transform: scale(1);
  }
`;

const Vaults = ({ vaults, handleSelect }: { vaults: IVault[]; handleSelect: any }) => (
  <Box fill justify="between" alignSelf="end" gap="small">
    <ListWrap>
      {vaults.length === 0 && (
        <Text weight={450} size="small">
          No suggested vaults
        </Text>
      )}

      {vaults.map((x: IVault, i: number) => (
        <StyledBox
          key={x.id}
          animation={{ type: 'fadeIn', delay: i * 100, duration: 1500 }}
          hoverIndicator={{ elevation: 'large', background: 'background' }}
          onClick={() => handleSelect(x)}
          round="xsmall"
          elevation="xsmall"
          flex={false}
          fill="horizontal"
        >
          <VaultListItem vault={x} />
        </StyledBox>
      ))}
    </ListWrap>
  </Box>
);

export default Vaults;

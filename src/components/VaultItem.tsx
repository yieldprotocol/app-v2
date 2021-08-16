import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { Box, Text } from 'grommet';
import { IUserContext, IVault } from '../types';
import { UserContext } from '../contexts/UserContext';

import PositionAvatar from './PositionAvatar';
import ItemWrap from './wraps/ItemWrap';

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

function VaultItem({ vault, index }: { vault: IVault; index: number }) {
  const history = useHistory();

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { seriesMap } = userState;
  const { setSelectedVault } = userActions;

  const series = seriesMap.get(vault.seriesId);

  const handleSelect = (_vault: IVault) => {
    setSelectedVault(_vault.id);
    history.push(`/vaultposition/${_vault.id}`);
  };

  return (
    <ItemWrap action={() => handleSelect(vault)} index={index}>
      <Box direction="row" gap="small" align="center" pad="small">
        <PositionAvatar position={vault} />
        <Box>
          <Text weight={900} size="small" color={vault.isActive ? undefined : 'text-xweak'}>
            {vault.displayName}
          </Text>
          {vault.isActive ? (
            <Box direction="column">
              <Text weight={450} size="xsmall">
                {series?.displayNameMobile}
              </Text>
              <Text weight={450} size="xsmall">
                Debt: {vault.art_}
              </Text>
            </Box>
          ) : (
            <Text weight={450} size="xsmall" color="text-xweak">
              Vault transfered or deleted
            </Text>
          )}
        </Box>
      </Box>
    </ItemWrap>
  );
}

export default VaultItem;

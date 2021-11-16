import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { Box, Text } from 'grommet';
import { ActionType, ISeries, IUserContext, IVault } from '../../types';
import { UserContext } from '../../contexts/UserContext';

import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';

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

function VaultItem({
  vault,
  index,
  condensed,
}: {
  vault: IVault;
  index: number;
  condensed?: boolean;
}) {
  const history = useHistory();

  const { userState: { seriesMap }, userActions } = useContext(UserContext) as IUserContext;
  const { setSelectedVault } = userActions;

  const handleSelect = (_vault: IVault) => {

    console.log(_vault);
    
    setSelectedVault(_vault);
    history.push(`/vaultposition/${_vault.id}`);
  };

  return (
    <ItemWrap action={() => handleSelect(vault)} index={index}>
      <Box direction="row" gap="small" align="center" pad="small" height={condensed ? '3rem' : undefined}>
        <PositionAvatar position={vault} condensed={condensed} actionType={ActionType.BORROW} />
        <Box
          fill={condensed ? 'horizontal' : undefined}
          justify={condensed ? 'between' : undefined}
          direction={condensed ? 'row' : undefined}
          align={condensed ? 'center' : undefined}
        >
            <Text weight={900} size="small" color={vault.isActive ? undefined : 'text-xweak'}>
              {vault.displayName}
            </Text>
          {vault.isActive ? (
            <Box direction="column">
              <Text weight={450} size="xsmall">
                {seriesMap.get(vault.seriesId)?.displayName}
              </Text>
              <Text weight={450} size="xsmall">
                Debt: {vault.art_}
              </Text>
            </Box>)
          :
            <Text weight={450} size="xsmall" color="text-xweak">
              Vault transfered or deleted
            </Text>
          }
        </Box>
      </Box>
    </ItemWrap>
  );
}

VaultItem.defaultProps = { condensed: false };

export default VaultItem;

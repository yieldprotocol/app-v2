import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';

import { Box, Text } from 'grommet';
import { ActionType, IUserContext, IVault } from '../../types';
import { UserContext } from '../../contexts/UserContext';

import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';

function VaultItem({ vault, index, condensed }: { vault: IVault; index: number; condensed?: boolean }) {
  const history = useHistory();

  const {
    userState: { seriesMap },
    userActions,
  } = useContext(UserContext) as IUserContext;
  const { setSelectedVault } = userActions;

  const handleSelect = (_vaultId: string) => {
    setSelectedVault(_vaultId);
    history.push(`/vaultposition/${_vaultId}`);
  };

  return (
    <ItemWrap action={() => handleSelect(vault.id)} index={index}>
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
                {seriesMap.get(vault.seriesId!)?.displayName}
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

VaultItem.defaultProps = { condensed: false };

export default VaultItem;

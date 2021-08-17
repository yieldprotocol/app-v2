import React, { useContext } from 'react';
import { Box, Text } from 'grommet';
import { IUserContext, IVault } from '../types';
import { UserContext } from '../contexts/UserContext';

import PositionAvatar from './PositionAvatar';

function VaultListItem({ vault, condensed }: { vault: IVault; condensed?: boolean }) {
  const { userState } = useContext(UserContext) as IUserContext;
  const { seriesMap } = userState;

  const series = seriesMap.get(vault.seriesId);

  return (
    <Box direction="row" gap="small" align="center" pad="small" height={condensed ? '3rem' : undefined}>
      <PositionAvatar position={vault} condensed={condensed} />
      <Box
        fill={condensed ? 'horizontal' : undefined}
        justify={condensed ? 'between' : undefined}
        direction={condensed ? 'row' : undefined}
      >
        <Box>
          <Text weight={900} size="small" color={vault.isActive ? undefined : 'text-xweak'}>
            {vault.displayName}
          </Text>
        </Box>
        <Box>
          {vault.isActive ? (
            <Box direction="row" gap="small">
              <Text weight={450} size="xsmall">
                {series?.displayNameMobile}
              </Text>
              <Text weight={450} size="xsmall">
                Debt: {vault.art_}
              </Text>
            </Box>
          ) : (
            <Text weight={450} size="xsmall" color="text-xweak">
              Vault deleted or transfered
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}

VaultListItem.defaultProps = { condensed: false };

export default VaultListItem;

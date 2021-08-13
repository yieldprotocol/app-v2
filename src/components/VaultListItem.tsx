import React, { useContext } from 'react';
import { Box, Text } from 'grommet';
import { IUserContext, IVault } from '../types';
import { UserContext } from '../contexts/UserContext';

import PositionAvatar from './PositionAvatar';

function VaultListItem({ vault }: { vault: IVault }) {
  const { userState } = useContext(UserContext) as IUserContext;
  const { seriesMap } = userState;

  const series = seriesMap.get(vault.seriesId);

  return (
    <Box direction="row" gap="small" align="center" pad="small">
      <PositionAvatar position={vault} />
      <Box>
        <Text weight={900} size="small" color={vault.isActive ? undefined : 'text-xweak'}>
          {vault.displayName}
        </Text>

        {vault.isActive ? (
          <Box direction="column" >
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
  );
}

export default VaultListItem;

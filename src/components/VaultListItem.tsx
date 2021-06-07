import React, { useContext } from 'react';
import { Box, Stack, Text } from 'grommet';
import { IAsset, ISeries, IUserContext, IVault } from '../types';
import { UserContext } from '../contexts/UserContext';

function VaultListItem({ vault }:{ vault:IVault }) {
  const { userState } = useContext(UserContext) as IUserContext;
  const { assetMap } = userState;

  const base = assetMap.get(vault.baseId);
  const ilk = assetMap.get(vault.ilkId);

  return (
    <Box
      direction="row"
      gap="small"
      align="center"
      pad="small"
    >
      <Box direction="row" round="large" pad="xsmall" background={`linear-gradient(90deg, ${base?.color} 40%, white 75%)`} gap="xsmall">
        {base?.image}
        {ilk?.image}
      </Box>

      <Box>
        <Text weight={900} size="small"> {vault.displayName} </Text>
        <Box>
          <Text weight={450} size="xsmall"> Debt:  {vault.art_} </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default VaultListItem;

import React, { useContext } from 'react';
import { Avatar, Box, Stack, Text } from 'grommet';
import { IAsset, ISeries, IUserContext, IVault } from '../types';
import { UserContext } from '../contexts/UserContext';
import YieldMark from './logos/YieldMark';
import PositionAvatar from './PositionAvatar';

function VaultListItem({ vault }:{ vault:IVault }) {
  const { userState } = useContext(UserContext) as IUserContext;
  const { assetMap, seriesMap } = userState;

  const base = assetMap.get(vault.baseId);
  const ilk = assetMap.get(vault.ilkId);
  const series = seriesMap.get(vault.seriesId);

  return (
    <Box
      direction="row"
      gap="small"
      align="center"
      pad="small"
      round="xsmall"
      // style={{
      //   backgroundImage: `url('data:image/svg+xml;utf8,' + 'svg')`,
      // }}
    >

      <PositionAvatar position={vault} />

      <Box>
        <Text weight={900} size="small"> {vault.displayName} </Text>
        <Box direction="column">
          <Text weight={450} size="xsmall"> {series?.displayNameMobile} </Text>
          <Text weight={450} size="xsmall"> Debt:  {vault.art_} </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default VaultListItem;

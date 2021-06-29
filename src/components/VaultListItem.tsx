import React, { useContext } from 'react';
import { Avatar, Box, Stack, Text } from 'grommet';
import { IAsset, ISeries, IUserContext, IVault } from '../types';
import { UserContext } from '../contexts/UserContext';
import YieldMark from './logos/YieldMark';

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
      <Stack anchor="top-right">
        <Avatar background={series?.color}>
          {/* <Box direction="row" pad="xsmall" round="large" background={`linear-gradient(90deg, ${base?.color} 40%, #ffffff00 75%)`} gap="xsmall">
          {base?.image}
          {ilk?.image}
        </Box> */}
          <Box
            round="large"
            background={base?.color}
            pad="xsmall"
            align="center"
          >
            {base?.image}
          </Box>
        </Avatar>
        <Avatar background="#fff" size="xsmall">
          {ilk?.image}
        </Avatar>
      </Stack>

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

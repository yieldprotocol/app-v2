import { Stack, Avatar, Box } from 'grommet';
import React, { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { IVault, ISeries, IAsset, IUserContext } from '../types';

function PositionAvatar({ position, condensed }: { position: IVault | ISeries; condensed?: boolean }) {
  const isVault = position?.id.length > 15;

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { assetMap, seriesMap } = userState;

  const base: IAsset | undefined = assetMap.get(position?.baseId!); // same for both series and vaults

  const vault: IVault | undefined = isVault ? (position as IVault) : undefined;
  const series: ISeries | undefined = vault ? seriesMap.get(vault.seriesId!) : (position as ISeries);

  const ilk: IAsset | undefined = vault && assetMap.get(vault.ilkId); // doesn't exist on series

  return (
    <>
      <Stack anchor="top-right">
        <Avatar background={series?.color} size={condensed ? '1.5rem' : undefined}>
          <Box round="large" background={base?.color} pad={condensed ? 'none' : 'xsmall'} align="center">
            {base?.image}
          </Box>
        </Avatar>
        <Avatar background={ilk?.image ? '#fff' : undefined} size={condensed ? '0.75rem' : 'xsmall'}>
          {ilk?.image || null}
        </Avatar>
      </Stack>
    </>
  );
}

PositionAvatar.defaultProps = { condensed: false };

export default PositionAvatar;

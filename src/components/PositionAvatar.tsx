import { useContext } from 'react';
import { Stack, Avatar, Box } from 'grommet';
import { FiClock } from 'react-icons/fi';
import { MdAutorenew } from 'react-icons/md';
import { UserContext } from '../contexts/UserContext';
import { IVault, ISeries, IAsset, IUserContext, IStrategy, ActionType, IUserContextState } from '../types';

function PositionAvatar({
  position,
  condensed,
  actionType,
}: {
  position: IVault | ISeries | IStrategy;
  actionType: ActionType;
  condensed?: boolean;
}) {
  const isVault = position?.id.length > 15;

  /* STATE FROM CONTEXT */
  const { userState }: { userState: IUserContextState } = useContext(UserContext) as IUserContext;
  const { assetMap, seriesMap } = userState;

  const base: IAsset | undefined = assetMap.get(position?.baseId!); // same for both series and vaults
  const vault: IVault | undefined = isVault ? (position as IVault) : undefined;
  const series: ISeries | undefined = vault ? seriesMap.get(vault.seriesId!) : (position as ISeries);

  const ilk: IAsset | undefined = vault && assetMap.get(vault.ilkId); // doesn't exist on series

  return (
    <>
      <Stack anchor="top-right">
        <Avatar
          background={series?.seriesIsMature ? 'lightGrey' : series?.color}
          size={condensed ? '1.5rem' : undefined}
        >
          <Box
            round="large"
            background={base?.color || 'lightBackground'}
            pad={condensed ? 'none' : 'xsmall'}
            align="center"
          >
            {base?.image}
          </Box>
        </Avatar>

        {actionType === ActionType.BORROW && (
          <Avatar background="lightBackground" size={condensed ? '0.75rem' : 'xsmall'}>
            {ilk?.image}
          </Avatar>
        )}
        {actionType === ActionType.POOL && (
          <Avatar background="lightBackground" size={condensed ? '0.75rem' : 'xsmall'}>
            {series?.seriesIsMature ? <FiClock /> : <MdAutorenew />}
          </Avatar>
        )}
      </Stack>
    </>
  );
}

PositionAvatar.defaultProps = { condensed: false };

export default PositionAvatar;

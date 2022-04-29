import { useContext } from 'react';
import { Avatar, Box } from 'grommet';
import { FiClock } from 'react-icons/fi';
import { MdAutorenew } from 'react-icons/md';
import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { IVault, ISeries, IAsset, IUserContext, IStrategy, ActionType, IUserContextState } from '../types';
import Logo from './logos/Logo';

const Outer = styled(Box)`
  position: relative;
  z-index: 0;
`;

const Inner = styled(Box)`
  position: absolute;
  z-index: 10;
  top: -2px;
  right: -2px;
`;

const Stack = styled(Box)`
  position: absolute;
  z-index: 20;
`;

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
  const baseImageSize = condensed ? '20px' : '24px';
  const ilkImageSize = condensed ? '16px' : '20px';

  return (
    <Outer>
      <Avatar background={series?.seriesIsMature ? 'lightGrey' : series?.color} size={condensed ? '36px' : undefined}>
        <Box round="large" background="white" pad="xxsmall">
          <Logo image={base.image} height={baseImageSize} width={baseImageSize} />
        </Box>

        <Inner>
          {actionType === ActionType.BORROW && (
            <Outer>
              <Avatar background="lightBackground" size={ilkImageSize}>
                <Stack>
                  <Logo image={ilk.image} height={ilkImageSize} width={ilkImageSize} />
                </Stack>
              </Avatar>
            </Outer>
          )}
          {actionType === ActionType.POOL && (
            <Avatar background="lightBackground" size={ilkImageSize}>
              {series?.seriesIsMature ? <FiClock /> : <MdAutorenew />}
            </Avatar>
          )}
        </Inner>
      </Avatar>
    </Outer>
  );
}

PositionAvatar.defaultProps = { condensed: false };

export default PositionAvatar;

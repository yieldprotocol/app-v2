import { useContext } from 'react';
import { Avatar, Box } from 'grommet';
import { FiClock } from 'react-icons/fi';
import { MdAutorenew } from 'react-icons/md';
import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { IVault, ISeries, IAsset, IStrategy, ActionType } from '../types';
import Logo from './logos/Logo';
import useVYTokens, { IVYToken } from '../hooks/entities/useVYTokens';
import useVaultsVR from '../hooks/entities/useVaultsVR';

const Outer = styled(Box)`
  position: relative;
  z-index: 0;
  width: ${(props) => props.width ?? undefined};
  min-width: ${(props) => (props.width ? `unset` : undefined)};
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
  position: IVault | ISeries | IStrategy | IVYToken | undefined;
  actionType: ActionType;
  condensed?: boolean;
}) {
  const isVault = position?.id.length! > 15;
  const { data: vyTokens } = useVYTokens();

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext);
  const { assetMap, seriesMap, vaultMap } = userState;
  const { data: vaultsVR } = useVaultsVR();

  const base = assetMap.get(position?.baseId!); // same for both series, vaults, and vyTokens
  const vault = isVault ? vaultMap.get(position?.id!) || vaultsVR?.get(position?.id!) : undefined;
  const series = vault ? seriesMap.get(vault.seriesId!) : seriesMap.get(position?.id!);
  const vyToken = vyTokens?.get(position?.id!);

  const ilk = vault && assetMap.get(vault.ilkId); // doesn't exist on series or vyTokens
  const baseImageSize = condensed ? '20px' : '24px';
  const ilkImageSize = condensed ? '16px' : '20px';
  const ilkBorderSize = condensed ? '18px' : '22px';

  return (
    <Outer width={condensed ? '36px' : 'auto'}>
      <Avatar
        background={vyToken ? 'gradient-transparent' : series?.seriesIsMature ? 'lightGrey' : series?.color}
        size={condensed ? '36px' : undefined}
      >
        <Box round="large" background="white" pad="xxsmall">
          <Logo image={base?.image} height={baseImageSize} width={baseImageSize} />
        </Box>
        <Inner>
          {actionType === ActionType.BORROW && (
            <Avatar background="lightBackground" size={ilkBorderSize}>
              <Stack>
                <Logo image={ilk?.image} height={ilkImageSize} width={ilkImageSize} />
              </Stack>
            </Avatar>
          )}
          {actionType === ActionType.POOL && (
            <Avatar background="lightBackground" size={ilkBorderSize}>
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

import { useRouter } from 'next/router';
import { useContext } from 'react';

import { Box, Text } from 'grommet';
import { ActionType, IUserContext, IVault } from '../../types';
import { UserContext } from '../../contexts/UserContext';

import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';
import SkeletonWrap from '../wraps/SkeletonWrap';

function VaultItem({ vault, index, condensed }: { vault: IVault; index: number; condensed?: boolean }) {
  const router = useRouter();

  const {
    userState: { seriesMap, vaultsLoading, selectedVault },
    userActions,
  } = useContext(UserContext) as IUserContext;
  const { setSelectedVault } = userActions;

  const handleSelect = (_vault: IVault) => {
    setSelectedVault(_vault);
    router.push(`/vaultposition/${_vault.id}`);
  };

  return (
    <ItemWrap
      action={() => handleSelect(vault)}
      index={index}
      liquidated={vault.hasBeenLiquidated}
      warn={!vault.isActive && !vault.isWitchOwner}
    >
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
                {seriesMap.get(vault.seriesId)?.displayName}
              </Text>
              <Box direction="row" gap="xsmall">
                <Text weight={450} size="xsmall">
                  Debt:
                </Text>
                <Text weight={450} size="xsmall">
                  {vaultsLoading && vault.id === selectedVault?.id ? <SkeletonWrap width={30} /> : vault.accruedArt_}
                </Text>
              </Box>
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

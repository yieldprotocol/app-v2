import { useRouter } from 'next/router';
import { useContext } from 'react';

import { Box, Text } from 'grommet';
import { ActionType, IVault } from '../../types';
import { UserContext } from '../../contexts/UserContext';

import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';
import SkeletonWrap from '../wraps/SkeletonWrap';
import { useBorrowHelpersVR } from '../../hooks/viewHelperHooks/useBorrowHelpers/useBorrowHelpersVR';
import { useBorrowHelpersFR } from '../../hooks/viewHelperHooks/useBorrowHelpers/useBorrowHelpersFR';
import useAssetPair from '../../hooks/viewHelperHooks/useAssetPair';
import { cleanValue } from '../../utils/appUtils';
import { GA_Event, GA_Properties } from '../../types/analytics';
import useAnalytics from '../../hooks/useAnalytics';

function VaultItem({ vault, index, condensed }: { vault: IVault; index: number; condensed?: boolean }) {
  const router = useRouter();
  const { logAnalyticsEvent } = useAnalytics();

  const {
    userState: { seriesMap, vaultsLoading, selectedVault, assetMap },
    userActions,
  } = useContext(UserContext);
  const { setSelectedVault } = userActions;

  const handleSelect = (_vault: IVault) => {
    setSelectedVault(_vault);
    router.push(`/vaultposition/${_vault.id}`);
    logAnalyticsEvent(GA_Event.position_opened, {
      id: _vault?.id.slice(2),
    } as GA_Properties.position_opened);
  };

  const vaultBase = assetMap?.get(vault.baseId);
  const vaultIlk = assetMap?.get(vault.ilkId);
  const vaultIsVR = !vault?.seriesId;

  const { data: assetPair } = useAssetPair(vaultBase?.id, vaultIlk?.id);

  const { debtInBase_: debtInBaseVR_ } = useBorrowHelpersVR(undefined, undefined, vault, assetPair);
  const { debtInBase_: debtInBaseFR_ } = useBorrowHelpersFR(undefined, undefined, vault, assetPair, undefined);

  const debtInBase_ = vaultIsVR ? debtInBaseVR_ : debtInBaseFR_;

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
            <Box direction="column" width={condensed ? '6rem' : undefined}>
              <Text weight={450} size="xsmall">
                {seriesMap?.get(vault.seriesId!)?.displayName}
              </Text>
              <Box direction="row" gap="xsmall">
                <Text weight={450} size="xsmall">
                  Debt:
                </Text>
                <Text weight={450} size="xsmall">
                  {(vaultsLoading && vault.id === selectedVault?.id) || !debtInBase_ ? (
                    <SkeletonWrap width={30} />
                  ) : (
                    cleanValue(debtInBase_, 2)
                  )}
                </Text>
              </Box>
            </Box>
          ) : (
            <Text weight={450} size="xsmall" color="text-xweak">
              Vault transferred or deleted
            </Text>
          )}
        </Box>
      </Box>
    </ItemWrap>
  );
}

VaultItem.defaultProps = { condensed: false };

export default VaultItem;

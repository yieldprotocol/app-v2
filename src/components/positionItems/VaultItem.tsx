import { useRouter } from 'next/router';
import { useContext } from 'react';

import { Box, Text } from 'grommet';
import { ActionType, IVault } from '../../types';
import { UserContext } from '../../contexts/UserContext';

import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';
import SkeletonWrap from '../wraps/SkeletonWrap';
import { useBorrowHelpers } from '../../hooks/viewHelperHooks/useBorrowHelpers';
import { useAssetPair } from '../../hooks/useAssetPair';
import { cleanValue } from '../../utils/appUtils';
import { GA_Event, GA_Properties } from '../../types/analytics';
import useAnalytics from '../../hooks/useAnalytics';
import useAsset from '../../hooks/useAsset';
import { CardSkeleton } from '../selectors/StrategySelector';
import useVaults from '../../hooks/useVaults';
import useSeriesEntity from '../../hooks/useSeriesEntity';

function VaultItem({ id, index, condensed }: { id: string; index: number; condensed?: boolean }) {
  const router = useRouter();
  const { logAnalyticsEvent } = useAnalytics();

  const {
    userActions: { setSelectedVault },
  } = useContext(UserContext);

  const { data: vaults } = useVaults();
  const vault = vaults?.get(id);
  const { data: vaultBase } = useAsset(vault?.baseId);
  const { data: seriesEntity } = useSeriesEntity(vault?.seriesId);
  const { data: vaultIlk } = useAsset(vault?.ilkId);

  const assetPairInfo = useAssetPair(vaultBase, vaultIlk);
  const { debtInBase_ } = useBorrowHelpers(undefined, undefined, id, assetPairInfo, undefined);

  const handleSelect = (_vault: IVault) => {
    setSelectedVault(_vault);
    router.push(`/vaultposition/${_vault.id}`);
    logAnalyticsEvent(GA_Event.position_opened, {
      id: _vault?.id.slice(2),
    } as GA_Properties.position_opened);
  };

  if (!vault)
    return (
      <ItemWrap action={() => null} index={index}>
        <CardSkeleton />
      </ItemWrap>
    );

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
                {seriesEntity?.displayName}
              </Text>
              <Box direction="row" gap="xsmall">
                <Text weight={450} size="xsmall">
                  Debt:
                </Text>
                <Text weight={450} size="xsmall">
                  {!debtInBase_ ? <SkeletonWrap width={30} /> : cleanValue(debtInBase_, 2)}
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

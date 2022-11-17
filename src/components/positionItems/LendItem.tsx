import { useRouter } from 'next/router';
import { useContext } from 'react';
import { Box, Text } from 'grommet';
import { ActionType, ISeries } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { cleanValue } from '../../utils/appUtils';
import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';
import { useLendHelpers } from '../../hooks/viewHelperHooks/useLendHelpers';
import SkeletonWrap from '../wraps/SkeletonWrap';
import useAnalytics from '../../hooks/useAnalytics';
import { GA_Event, GA_Properties } from '../../types/analytics';
import useAsset from '../../hooks/useAsset';
import useSeriesEntity from '../../hooks/useSeriesEntity';
import { CardSkeleton } from '../selectors/StrategySelector';

function LendItem({
  seriesId,
  index,
  actionType,
  condensed,
}: {
  seriesId: string;
  index: number;
  actionType: ActionType;
  condensed?: boolean;
}) {
  const router = useRouter();
  const { logAnalyticsEvent } = useAnalytics();
  const { userActions } = useContext(UserContext);
  const { fyTokenMarketValue } = useLendHelpers(seriesId, '0');
  const { data: seriesEntity } = useSeriesEntity(seriesId);
  const { data: seriesBase } = useAsset(seriesEntity?.baseId);

  const handleSelect = (_series: ISeries) => {
    userActions.setSelectedBase(seriesBase!);
    userActions.setSelectedSeries(_series);
    router.push(`/${actionType.toLowerCase()}position/${_series.id}`);
    logAnalyticsEvent(GA_Event.position_opened, {
      id: _series.name,
    } as GA_Properties.position_opened);
  };

  if (!seriesEntity)
    return (
      <ItemWrap action={() => null} index={index}>
        <CardSkeleton />
      </ItemWrap>
    );

  return (
    <ItemWrap action={() => handleSelect(seriesEntity)} index={index}>
      <Box direction="row" gap="small" align="center" pad="small" height={condensed ? '3rem' : undefined}>
        <PositionAvatar position={seriesEntity} condensed={condensed} actionType={ActionType.LEND} />
        <Box
          fill={condensed ? 'horizontal' : undefined}
          justify={condensed ? 'between' : undefined}
          direction={condensed ? 'row' : undefined}
          width={condensed ? '6rem' : undefined}
        >
          <Text weight={900} size="small">
            {seriesEntity.displayName}
          </Text>
          <Box direction="row" gap="xsmall">
            {fyTokenMarketValue !== 'Low liquidity' && (
              <Box direction="row" gap="xsmall">
                <Text weight={450} size="xsmall">
                  Balance:
                </Text>
                <Text weight={450} size="xsmall">
                  {fyTokenMarketValue ? (
                    <SkeletonWrap width={30} />
                  ) : (
                    cleanValue(fyTokenMarketValue, seriesBase?.digitFormat!)
                  )}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </ItemWrap>
  );
}

LendItem.defaultProps = { condensed: false };

export default LendItem;

import { useRouter } from 'next/router';
import { useContext } from 'react';
import { Box, Text } from 'grommet';
import { ActionType, ISeries, ISeriesRoot } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { cleanValue } from '../../utils/appUtils';
import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';
import { useLendHelpers } from '../../hooks/viewHelperHooks/useLendHelpers';
import SkeletonWrap from '../wraps/SkeletonWrap';
import useAnalytics from '../../hooks/useAnalytics';
import { GA_Event, GA_Properties } from '../../types/analytics';
import useSeriesEntities from '../../hooks/useSeriesEntities';

function LendItem({
  seriesId,
  index,
  condensed,
}: {
  seriesId: string;
  index: number;
  actionType: ActionType;
  condensed?: boolean;
}) {
  const router = useRouter();
  const { logAnalyticsEvent } = useAnalytics();

  const {
    userState: { assetMap, selectedSeriesId, selectedBase },
    userActions,
  } = useContext(UserContext);
  const {
    seriesEntities: { data: seriesEntities },
  } = useSeriesEntities(seriesId);

  const seriesEntity = seriesEntities?.get(seriesId);

  const { fyTokenMarketValue } = useLendHelpers(seriesId, '0');
  const seriesBase = assetMap?.get(seriesEntity?.baseId!);
  const isSelectedBaseAndSeries = seriesEntity?.baseId === seriesBase?.proxyId && seriesEntity?.id === selectedSeriesId;

  const handleSelect = (_series: ISeriesRoot) => {
    userActions.setSelectedBase(selectedBase);
    userActions.setSelectedSeriesId(_series.id);
    router.push(`/lendposition/${_series.id}`);
    logAnalyticsEvent(GA_Event.position_opened, {
      id: seriesEntity?.name,
    } as GA_Properties.position_opened);
  };

  return (
    <ItemWrap action={() => handleSelect(seriesEntity!)} index={index}>
      <Box direction="row" gap="small" align="center" pad="small" height={condensed ? '3rem' : undefined}>
        <PositionAvatar position={seriesEntity!} condensed={condensed} actionType={ActionType.LEND} />
        <Box
          fill={condensed ? 'horizontal' : undefined}
          justify={condensed ? 'between' : undefined}
          direction={condensed ? 'row' : undefined}
          width={condensed ? '6rem' : undefined}
        >
          <Text weight={900} size="small">
            {seriesEntity?.displayName}
          </Text>
          <Box direction="row" gap="xsmall">
            {fyTokenMarketValue !== 'Low liquidity' && (
              <Box direction="row" gap="xsmall">
                <Text weight={450} size="xsmall">
                  Balance:
                </Text>
                <Text weight={450} size="xsmall">
                  {isSelectedBaseAndSeries ? (
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

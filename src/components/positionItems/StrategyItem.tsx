import { useRouter } from 'next/router';
import { Box, Text } from 'grommet';

import { ActionType } from '../../types';
import { formatStrategyName, nFormatter } from '../../utils/appUtils';
import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';
import useAnalytics from '../../hooks/useAnalytics';
import { GA_Event, GA_Properties } from '../../types/analytics';
import useAsset from '../../hooks/useAsset';
import useStrategy from '../../hooks/useStrategy';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { CardSkeleton } from '../selectors/StrategySelector';
import SkeletonWrap from '../wraps/SkeletonWrap';
import useSeriesEntity from '../../hooks/useSeriesEntity';

function StrategyItem({
  strategyAddress,
  index,
  condensed,
}: {
  strategyAddress: string;
  index: number;
  condensed?: boolean;
}) {
  const router = useRouter();
  const {
    userActions: { setSelectedSeries, setSelectedBase, setSelectedStrategy },
  } = useContext(UserContext);
  const { logAnalyticsEvent } = useAnalytics();
  const { data: strategy, isValidating, error } = useStrategy(strategyAddress);
  const { data: seriesEntity } = useSeriesEntity(strategy?.currentSeriesId!);
  const { data: base } = useAsset(strategy?.baseId!);

  const handleSelect = () => {
    if (strategy) {
      setSelectedStrategy(strategy);
      setSelectedSeries(seriesEntity!);
      setSelectedBase(base!);
      router.push(`/poolposition/${strategy.address}`);
      logAnalyticsEvent(GA_Event.position_opened, {
        id: strategy.name,
      } as GA_Properties.position_opened);
    }
  };

  if (error) return null;

  if (!strategy || !seriesEntity)
    return (
      <ItemWrap action={handleSelect} index={index}>
        <CardSkeleton />
      </ItemWrap>
    );

  return (
    <ItemWrap action={handleSelect} index={index}>
      <Box direction="row" gap="small" align="center" pad="small" height={condensed ? '3rem' : undefined}>
        <PositionAvatar position={seriesEntity} condensed={condensed} actionType={ActionType.POOL} />
        <Box
          fill={condensed ? 'horizontal' : undefined}
          justify={condensed ? 'between' : undefined}
          direction={condensed ? 'row' : undefined}
        >
          <Box justify="center">
            <Text weight={900} size="small">
              {formatStrategyName(strategy.name)}
            </Text>
            <Text size="xsmall">Rolling: {seriesEntity.fullDate}</Text>
          </Box>

          <Box justify="center" width={'6rem'}>
            <Box gap="xxsmall" direction="row">
              <Text weight={450} size="xsmall">
                Tokens:
              </Text>
              <Text weight={450} size="xsmall">
                {isValidating ? (
                  <SkeletonWrap width={20} />
                ) : (
                  nFormatter(parseFloat(strategy.accountBalance.formatted), 2)
                )}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </ItemWrap>
  );
}

StrategyItem.defaultProps = { condensed: false };

export default StrategyItem;

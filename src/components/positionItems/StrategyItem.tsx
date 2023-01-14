import { useRouter } from 'next/router';
import { useContext } from 'react';
import { Box, Text } from 'grommet';

import { ActionType, IStrategy } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { formatStrategyName, nFormatter } from '../../utils/appUtils';
import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';
import SkeletonWrap from '../wraps/SkeletonWrap';
import useAnalytics from '../../hooks/useAnalytics';
import { GA_Event, GA_Properties } from '../../types/analytics';

function StrategyItem({ strategy, index, condensed }: { strategy: IStrategy; index: number; condensed?: boolean }) {
  const router = useRouter();
  const { logAnalyticsEvent } = useAnalytics();

  const {
    userState: { assetMap, seriesMap, strategiesLoading, selectedStrategy },
    userActions,
  } = useContext(UserContext);

  const base = assetMap?.get(strategy.baseId) || null;
  const series = seriesMap?.get(strategy.currentSeries!.id) || null;
  const isSelectedStrategy = strategy.id === selectedStrategy?.id;

  const handleSelect = (_series: IStrategy) => {
    userActions.setSelectedBase(base);
    userActions.setSelectedSeries(series);
    userActions.setSelectedStrategy(strategy);
    router.push(`/poolposition/${strategy.address}`);
    logAnalyticsEvent(GA_Event.position_opened, {
      id: strategy?.name,
    } as GA_Properties.position_opened);
  };

  return (
    <ItemWrap action={() => handleSelect(strategy)} index={index}>
      <Box direction="row" gap="small" align="center" pad="small" height={condensed ? '3rem' : undefined}>
        <PositionAvatar position={strategy.currentSeries!} condensed={condensed} actionType={ActionType.POOL} />
        <Box
          fill={condensed ? 'horizontal' : undefined}
          justify={condensed ? 'between' : undefined}
          direction={condensed ? 'row' : undefined}
        >
          <Box justify="center">
            <Text weight={900} size="small">
              {formatStrategyName(strategy.name)}
            </Text>
            <Text size="xsmall">Rolling: {strategy.currentSeries?.fullDate}</Text>
          </Box>

          <Box justify="center" width={'6rem'}>
            <Box gap="xxsmall" direction="row">
              <Text weight={450} size="xsmall">
                Tokens:
              </Text>
              <Text weight={450} size="xsmall">
                {strategiesLoading && isSelectedStrategy ? (
                  <SkeletonWrap width={30} />
                ) : (
                  nFormatter(parseFloat(strategy.accountBalance_!), 2)
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

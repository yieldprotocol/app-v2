import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Text } from 'grommet';

import { ActionType, ISeries, IStrategy, IUserContext, IUserContextActions, IUserContextState } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { cleanValue, nFormatter } from '../../utils/appUtils';
import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';
import SkeletonWrap from '../wraps/SkeletonWrap';

function StrategyItem({ strategy, index, condensed }: { strategy: IStrategy; index: number; condensed?: boolean }) {
  const history = useHistory();

  const {
    userState: { assetMap, seriesMap, strategiesLoading, selectedStrategy },
    userActions,
  }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(UserContext) as IUserContext;

  const base = assetMap.get(strategy.baseId) || null;
  const series = seriesMap.get(strategy.currentSeriesId) || null;
  const isSelectedStrategy = strategy.id === selectedStrategy?.id;

  const handleSelect = (_series: IStrategy) => {
    userActions.setSelectedBase(base);
    userActions.setSelectedSeries(series);
    userActions.setSelectedStrategy(strategy);
    history.push(`/poolposition/${strategy.address}`);
  };

  return (
    <ItemWrap action={() => handleSelect(strategy)} index={index}>
      <Box direction="row" gap="small" align="center" pad="small" height={condensed ? '3rem' : undefined}>
        <PositionAvatar position={strategy.currentSeries!} condensed={condensed} actionType={ActionType.POOL} />
        <Box fill={condensed ? 'horizontal' : undefined} justify={condensed ? 'between' : undefined}>
          <Text weight={900} size="small">
            {strategy.name}
          </Text>
          <Box direction="row" gap="medium">
            <Box gap="xxsmall" direction={condensed ? 'row' : undefined}>
              <Text weight={450} size="xsmall">
                Tokens:
              </Text>
              <Text weight={450} size="xsmall">
                {/* Tokens:  {cleanValue(series.poolTokens_, 2)} */}
                {strategiesLoading && isSelectedStrategy ? (
                  <SkeletonWrap width={30} />
                ) : (
                  nFormatter(parseFloat(strategy.accountBalance_!), 2)
                )}
              </Text>
            </Box>
            <Box gap="xxsmall" direction={condensed ? 'row' : undefined}>
              <Text weight={450} size="xsmall">
                Strategy %:
              </Text>
              <Text weight={450} size="xsmall">
                {strategiesLoading && isSelectedStrategy ? (
                  <SkeletonWrap width={30} />
                ) : (
                  cleanValue(strategy.accountStrategyPercent, 2)
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

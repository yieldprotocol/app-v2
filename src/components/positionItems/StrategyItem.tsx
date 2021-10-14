import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Text } from 'grommet';
import { ActionType, ISeries, IStrategy, IUserContext } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { cleanValue, nFormatter } from '../../utils/appUtils';
import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';

function StrategyItem({ strategy, index, condensed }: { strategy: IStrategy; index: number; condensed?: boolean }) {
  const history = useHistory();

  const { userState, userActions } = useContext(UserContext) as IUserContext;

  const handleSelect = (_series: IStrategy) => {
    userActions.setSelectedBase(strategy.baseId);
    userActions.setSelectedSeries(strategy.currentSeriesId);
    userActions.setSelectedStrategy(strategy.address);

    history.push(`/poolposition/${strategy.address}`);
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
          <Text weight={900} size="small">
            {strategy.name}
          </Text>
          <Box direction="row" gap="small">
            <Text weight={450} size="xsmall">
              {/* Tokens:  {cleanValue(series.poolTokens_, 2)} */}
              Tokens: {nFormatter(parseFloat(strategy.accountBalance_!), 2)}
            </Text>
            <Text weight={450} size="xsmall">
              Strategy %: {cleanValue(strategy.accountStrategyPercent, 2)}
            </Text>
          </Box>
        </Box>
      </Box>
    </ItemWrap>
  );
}

StrategyItem.defaultProps = { condensed: false };

export default StrategyItem;

import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Text } from 'grommet';
import { ActionType, ISeries, IUserContext } from '../types';
import { UserContext } from '../contexts/UserContext';
import { cleanValue, nFormatter } from '../utils/appUtils';
import PositionAvatar from './PositionAvatar';
import ItemWrap from './wraps/ItemWrap';

function Position({ series, index, actionType }: { series: ISeries; index: number; actionType: ActionType }) {
  const history = useHistory();

  const { userState, userActions } = useContext(UserContext) as IUserContext;

  const handleSelect = (_series: ISeries) => {
    userActions.setSelectedBase(_series.baseId);
    userActions.setSelectedSeries(_series.id);

    actionType === 'LEND' ? history.push(`/lendposition/${_series.id}`) : history.push(`/poolposition/${_series.id}`);
  };

  return (
    <ItemWrap action={() => handleSelect(series)} index={index}>
      <Box direction="row" gap="small" align="center" pad="small" round="xsmall" height="3rem">
        <PositionAvatar position={series} condensed />

        <Box fill direction="row" justify="between" align="center">
          <Text weight={900} size="small">
            {series.displayName}
          </Text>
          <Box direction="row" gap="small">
            {actionType === 'LEND' && (
              <Text weight={450} size="xsmall">
                Balance: {cleanValue(series.fyTokenBalance_, 2)}
              </Text>
            )}

            {actionType === 'POOL' && (
              <Text weight={450} size="xsmall">
                Tokens: {nFormatter(parseFloat(series.poolTokens_!), 2)}
              </Text>
            )}

            {actionType === 'POOL' && (
              <Text weight={450} size="xsmall">
                Pool %: {cleanValue(series.poolPercent, 2)}
              </Text>
            )}
          </Box>
        </Box>
      </Box>
    </ItemWrap>
  );
}

export default Position;

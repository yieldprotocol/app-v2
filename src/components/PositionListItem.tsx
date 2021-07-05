import React, { useContext } from 'react';
import { Avatar, Box, Stack, Text } from 'grommet';
import { ActionType, IAsset, ISeries, IUserContext, IVault } from '../types';
import { UserContext } from '../contexts/UserContext';
import { cleanValue, nFormatter } from '../utils/appUtils';
import PositionAvatar from './PositionAvatar';

function PositionListItem({ series, actionType }:{ series:ISeries, actionType:ActionType }) {
  const { userState } = useContext(UserContext) as IUserContext;
  const { assetMap } = userState;

  return (
    <Box
      direction="row"
      gap="small"
      align="center"
      pad="small"
      round="xsmall"
    >

      <PositionAvatar position={series} />

      <Box>
        <Text weight={900} size="small"> {series.displayName} </Text>
        <Box direction="row" gap="small">

          { actionType === 'LEND' &&
          <Text weight={450} size="xsmall">
            Balance:  {cleanValue(series.fyTokenBalance_, 2) }
          </Text>}

          { actionType === 'POOL' &&
          <Text weight={450} size="xsmall">
            {/* Tokens:  {cleanValue(series.poolTokens_, 2)} */}
            Tokens:  {nFormatter(parseFloat(series.poolTokens_!), 2)}
          </Text>}

          { actionType === 'POOL' &&
          <Text weight={450} size="xsmall">
            Pool %:  {cleanValue(series.poolPercent, 2)}
          </Text>}

        </Box>
      </Box>
    </Box>
  );
}

export default PositionListItem;

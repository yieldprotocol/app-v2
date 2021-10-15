import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Text } from 'grommet';
import { ActionType, ISeries, IUserContext } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { cleanValue } from '../../utils/appUtils';
import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';
import { useLendHelpers } from '../../hooks/actionHelperHooks/useLendHelpers';

function LendItem({
  series,
  index,
  actionType,
  condensed,
}: {
  series: ISeries;
  index: number;
  actionType: ActionType;
  condensed?: boolean;
}) {
  const history = useHistory();

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { fyTokenMarketValue } = useLendHelpers(series!, '0');
  const selectedBase = userState.assetMap?.get(series?.baseId!);

  const handleSelect = (_series: ISeries) => {
    userActions.setSelectedBase(_series.baseId);
    userActions.setSelectedSeries(_series.id);

    history.push(`/${actionType.toLowerCase()}position/${_series.id}`);
  };

  return (
    <ItemWrap action={() => handleSelect(series)} index={index}>
      <Box direction="row" gap="small" align="center" pad="small" height={condensed ? '3rem' : undefined}>
        <PositionAvatar position={series} condensed={condensed} actionType={ActionType.LEND} />
        <Box
          fill={condensed ? 'horizontal' : undefined}
          justify={condensed ? 'between' : undefined}
          direction={condensed ? 'row' : undefined}
        >
          <Text weight={900} size="small">
            {series.displayName}
          </Text>
          <Box direction="row" gap="small">
            {actionType === 'LEND' && (
              <Text weight={450} size="xsmall">
                Balance: {cleanValue(fyTokenMarketValue, selectedBase?.digitFormat!)}
              </Text>
            )}
          </Box>
        </Box>
      </Box>
    </ItemWrap>
  );
}

LendItem.defaultProps = { condensed: false };

export default LendItem;

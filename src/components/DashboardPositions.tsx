import React, { useCallback, useContext, useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { Box, Button, Text } from 'grommet';

import { UserContext } from '../contexts/UserContext';
import { ActionType, IAsset, ISeries, IUserContext } from '../types';
import { ZERO_BN } from '../utils/constants';
import Position from './DashboardPosition';
import ListWrap from './wraps/ListWrap';

interface IPositionFilter {
  base: IAsset | undefined;
  series: ISeries | undefined;
}

const Positions = ({ actionType }: { actionType: ActionType }) => {
  const history = useHistory();

  /* STATE FROM CONTEXT */
  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { assetMap, seriesMap, selectedSeriesId, selectedBaseId } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  const [allPositions, setAllPositions] = useState<ISeries[]>([]);
  const [showAllPositions, setShowAllPositions] = useState<boolean>(false);

  const [currentFilter, setCurrentFilter] = useState<IPositionFilter>();
  const [filterLabels, setFilterLabels] = useState<(string | undefined)[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<ISeries[]>([]);

  const handleSelect = (_series: ISeries) => {
    userActions.setSelectedBase(_series.baseId);
    userActions.setSelectedSeries(_series.id);

    actionType === 'LEND' ? history.push(`/lendposition/${_series.id}`) : history.push(`/poolposition/${_series.id}`);
  };

  useEffect(() => {
    /* only if veiwing the main screen (not when modal is showing) */
    const _allPositions: ISeries[] = Array.from(seriesMap.values())
      /* filter by positive balances on either pool tokens or fyTokens */
      .filter((_series: ISeries) => (actionType === 'LEND' && _series ? _series.fyTokenBalance?.gt(ZERO_BN) : true))
      .filter((_series: ISeries) => (actionType === 'POOL' && _series ? _series.poolTokens?.gt(ZERO_BN) : true));
    setAllPositions(_allPositions);
  }, [selectedBase, selectedSeries, seriesMap, actionType]);

  useEffect(() => {
    allPositions.length <= 5 && setShowAllPositions(true);
  }, [allPositions]);

  return (
    <>
      <ListWrap>
        {allPositions.length === 0 && (
          <Text weight={450} size="small">
            No suggested positions
          </Text>
        )}

        {allPositions.map((x: ISeries, i: number) => (
          <Position series={x} actionType={actionType} index={i} key={x.id} />
        ))}
      </ListWrap>
    </>
  );
};

export default Positions;

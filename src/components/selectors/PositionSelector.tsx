import React, { useCallback, useContext, useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { Box, Button, Text } from 'grommet';

import { UserContext } from '../../contexts/UserContext';
import { ActionType, IAsset, ISeries, IUserContext } from '../../types';
import { ZERO_BN } from '../../utils/constants';
import LendPosition from '../../views/LendPosition';
import PoolPosition from '../../views/PoolPosition';
import PositionListItem from '../PositionItem';
import ListWrap from '../wraps/ListWrap';
import ModalWrap from '../wraps/ModalWrap';

interface IPositionFilter {
  base: IAsset | undefined;
  series: ISeries | undefined;
}

function PositionSelector({ actionType }: { actionType: ActionType }) {
  const history = useHistory();
  /* STATE FROM CONTEXT */

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, seriesMap, selectedSeriesId, selectedBaseId } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  const [allPositions, setAllPositions] = useState<ISeries[]>([]);
  const [showAllPositions, setShowAllPositions] = useState<boolean>(false);

  const [currentFilter, setCurrentFilter] = useState<IPositionFilter>();
  const [filterLabels, setFilterLabels] = useState<(string | undefined)[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<ISeries[]>([]);

  const handleSelect = (_series: ISeries) => {
    console.log(_series.id);
    userActions.setSelectedBase(_series.baseId);
    userActions.setSelectedSeries(_series.id);

    actionType === 'LEND' ? history.push(`/lendposition/${_series.id}`) : history.push(`/poolposition/${_series.id}`);
  };

  const handleFilter = useCallback(
    ({ base, series }: IPositionFilter) => {
      /* filter all positions by base if base is selected */
      const _filteredSeries: ISeries[] = Array.from(seriesMap.values())
        /* filter by positive balances on either pool tokens or fyTokens */
        .filter((_series: ISeries) => (actionType === 'LEND' && _series ? _series.fyTokenBalance?.gt(ZERO_BN) : true))
        .filter((_series: ISeries) => (actionType === 'POOL' && _series ? _series.poolTokens?.gt(ZERO_BN) : true))
        .filter((_series: ISeries) => (base ? _series.baseId === base.id : true))
        .filter((_series: ISeries) => (series ? _series.id === series.id : true));

      setCurrentFilter({ base, series });
      setFilterLabels([base?.symbol, series?.displayNameMobile]);
      setFilteredSeries(_filteredSeries);
    },
    [seriesMap, actionType]
  );

  /* CHECK the list of current vaults which match the current base series selection */
  useEffect(() => {
    /* only if veiwing the main screen (not when modal is showing) */
    // if (!showPositionModal) {
    const _allPositions: ISeries[] = Array.from(seriesMap.values())
      /* filter by positive balances on either pool tokens or fyTokens */
      .filter((_series: ISeries) => (actionType === 'LEND' && _series ? _series.fyTokenBalance?.gt(ZERO_BN) : true))
      .filter((_series: ISeries) => (actionType === 'POOL' && _series ? _series.poolTokens?.gt(ZERO_BN) : true))
      .sort((_seriesA: ISeries, _seriesB: ISeries) =>
        actionType === 'LEND' && _seriesA.fyTokenBalance?.gt(_seriesB.fyTokenBalance!) ? 1 : -1
      )
      .sort((_seriesA: ISeries, _seriesB: ISeries) =>
        actionType === 'POOL' && _seriesA.poolTokens?.lt(_seriesB.poolTokens!) ? 1 : -1
      );
    setAllPositions(_allPositions);

    if (selectedBase) handleFilter({ base: selectedBase, series: undefined });
    if (selectedBase && selectedSeries) handleFilter({ base: selectedBase, series: selectedSeries });
    // }
  }, [selectedBase, selectedSeries, handleFilter, seriesMap, actionType]);

  useEffect(() => {
    allPositions.length <= 5 && setShowAllPositions(true);
  }, [allPositions]);

  return (
    <Box justify="end" fill>
      {allPositions.length !== 0 && (
        <Box justify="between" alignSelf="end" gap="small" pad="small">
          <Box animation="fadeIn" justify="center" align="center" direction="row" gap="small">
            <Text size="small" color="text-weak">
              {showAllPositions
                ? `Open ${actionType === 'LEND' ? 'lending' : 'pool'} positions`
                : `Filtered ${actionType === 'LEND' ? 'lending' : 'pool'} positions`}
            </Text>
          </Box>

          <ListWrap>
            {filteredSeries.length === 0 && !showAllPositions && (
              <Text weight={450} size="small">
                No suggested positions
              </Text>
            )}

            {(!showAllPositions ? filteredSeries : allPositions).map((x: ISeries, i: number) => (
              <PositionListItem series={x} actionType={actionType} index={i} key={x.id} />
            ))}
          </ListWrap>

          {!showAllPositions && (
            <Box direction="row" gap="xsmall" justify="end" align="center">
              {filterLabels[0] && (
                <Box
                  gap="xsmall"
                  border
                  direction="row"
                  round="xsmall"
                  pad={{ horizontal: 'xsmall', vertical: 'xsmall' }}
                >
                  <Text size="xsmall">{filterLabels[0]}</Text>
                  <Text
                    size="xsmall"
                    onClick={() =>
                      handleFilter({
                        ...currentFilter,
                        base: undefined,
                      } as IPositionFilter)
                    }
                  >
                    <Button plain icon={<FiX style={{ verticalAlign: 'middle' }} />} />
                  </Text>
                </Box>
              )}
              {filterLabels[1] && (
                <Box
                  gap="xsmall"
                  direction="row"
                  border
                  round="xsmall"
                  pad={{ horizontal: 'xsmall', vertical: 'xsmall' }}
                >
                  <Text size="xsmall">{filterLabels[1]}</Text>
                  <Text
                    size="xsmall"
                    onClick={() =>
                      handleFilter({
                        ...currentFilter,
                        series: undefined,
                      } as IPositionFilter)
                    }
                  >
                    <Button plain icon={<FiX style={{ verticalAlign: 'middle' }} />} />
                  </Text>
                </Box>
              )}
            </Box>
          )}

          {allPositions.length > 5 && (
            <Box align="end" onClick={() => setShowAllPositions(!showAllPositions)}>
              <Text size="xsmall" color="text-weak">
                {showAllPositions
                  ? `Show suggested ${selectedBase?.symbol || ''} positions only`
                  : `Show all ${allPositions.length} positions`}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default PositionSelector;

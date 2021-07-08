import { Box, Layer, Text } from 'grommet';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { UserContext } from '../../contexts/UserContext';
import { ActionType, IAsset, ISeries, IUserContext } from '../../types';
import { ZERO_BN } from '../../utils/constants';
import LendPosition from '../../views/LendPosition';
import PoolPosition from '../../views/PoolPosition';
import PositionListItem from '../PositionListItem';
import ListWrap from '../wraps/ListWrap';
import ModalWrap from '../wraps/ModalWrap';

interface IPositionFilter {
  base: IAsset | undefined;
  series: ISeries | undefined;
}

function PositionSelector({ actionType }: { actionType: ActionType }) {
  /* STATE FROM CONTEXT */

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const {
    activeAccount,
    assetMap,
    seriesMap,
    selectedSeriesId,
    selectedBaseId,
  } = userState;

  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);

  const [allPositions, setAllPositions] = useState<ISeries[]>([]);
  const [showAllPositions, setShowAllPositions] = useState<boolean>(false);
  const [showPositionModal, setShowPositionModal] = useState<boolean>(false);

  const [currentFilter, setCurrentFilter] = useState<IPositionFilter>();
  const [filterLabels, setFilterLabels] = useState<(string | undefined)[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<ISeries[]>([]);

  const handleSelect = (_series: ISeries) => {
    console.log(_series.id);
    userActions.setSelectedBase(_series.baseId);
    userActions.setSelectedSeries(_series.id);
    setShowPositionModal(true);
  };

  const handleFilter = useCallback(
    ({ base, series }: IPositionFilter) => {
      /* filter all positions by base if base is selected */
      const _filteredSeries: ISeries[] = Array.from(seriesMap.values())
        /* filter by positive balances on either pool tokens or fyTokens */
        .filter((_series: ISeries) =>
          actionType === 'LEND' && _series
            ? _series.fyTokenBalance?.gt(ZERO_BN)
            : true
        )
        .filter((_series: ISeries) =>
          actionType === 'POOL' && _series
            ? _series.poolTokens?.gt(ZERO_BN)
            : true
        )
        .filter((_series: ISeries) =>
          base ? _series.baseId === base.id : true
        )
        .filter((_series: ISeries) =>
          series ? _series.id === series.id : true
        );
      setCurrentFilter({ base, series });
      setFilterLabels([base?.symbol, series?.displayNameMobile]);
      setFilteredSeries(_filteredSeries);
    },
    [seriesMap, actionType]
  );

  /* CHECK the list of current vaults which match the current base series selection */
  useEffect(() => {
    /* only if veiwing the main screen (not when modal is showing) */
    if (!showPositionModal) {
      const _allPositions: ISeries[] = Array.from(seriesMap.values())
        /* filter by positive balances on either pool tokens or fyTokens */
        .filter((_series: ISeries) =>
          actionType === 'LEND' && _series
            ? _series.fyTokenBalance?.gt(ZERO_BN)
            : true
        )
        .filter((_series: ISeries) =>
          actionType === 'POOL' && _series
            ? _series.poolTokens?.gt(ZERO_BN)
            : true
        );
      setAllPositions(_allPositions);

      if (selectedBase) handleFilter({ base: selectedBase, series: undefined });
      if (selectedBase && selectedSeries)
        handleFilter({ base: selectedBase, series: selectedSeries });
    }
  }, [
    selectedBase,
    selectedSeries,
    showPositionModal,
    handleFilter,
    seriesMap,
    actionType,
  ]);

  return (
    <>
      <ModalWrap
        modalOpen={showPositionModal}
        toggleModalOpen={() => setShowPositionModal(!showPositionModal)}
        background={selectedSeries?.color}
      >
        {actionType === 'LEND' ? <LendPosition /> : <PoolPosition />}
      </ModalWrap>

      {allPositions.length !== 0 && (
        <Box justify="between" alignSelf="end" gap="small" pad="small">
          <Box
            animation="fadeIn"
            justify="end"
            align="end"
            direction="row"
            gap="small"
          >
            <Text size="small" color="text-weak">
              {showAllPositions
                ? `All my ${
                    actionType === 'LEND' ? 'lending' : 'pool'
                  } positions`
                : `My ${actionType === 'LEND' ? 'lending' : 'pool'} positions`}
            </Text>
          </Box>

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
                    {' '}
                    x
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
                    x
                  </Text>
                </Box>
              )}
            </Box>
          )}
          <ListWrap>
            {filteredSeries.length === 0 && !showAllPositions && (
              <Text weight={450} size="small">
                {' '}
                No suggested positions{' '}
              </Text>
            )}

            {(!showAllPositions ? filteredSeries : allPositions).map(
              (x: ISeries, i: number) => (
                <Box
                  key={x.id}
                  animation={{ type: 'fadeIn', delay: i * 100, duration: 1500 }}
                  hoverIndicator={{ elevation: 'large' }}
                  onClick={() => handleSelect(x)}
                  round="small"
                  elevation="medium"
                  flex={false}
                  fill="horizontal"
                >
                  <PositionListItem series={x} actionType={actionType} />
                </Box>
              )
            )}
          </ListWrap>

          <Box
            align="end"
            onClick={() => setShowAllPositions(!showAllPositions)}
          >
            <Text size="xsmall" color="text-weak">
              {showAllPositions
                ? `Show suggested ${selectedBase?.symbol || ''} positions only`
                : `Show all ${allPositions.length} positions`}
            </Text>
          </Box>
        </Box>
      )}
    </>
  );
}

export default PositionSelector;

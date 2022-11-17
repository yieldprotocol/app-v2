import { useCallback, useContext, useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { Box, Button, Text } from 'grommet';

import { UserContext } from '../../contexts/UserContext';

import { ActionType, IAsset, ISeries } from '../../types';

import { ZERO_BN } from '../../utils/constants';
import LendItem from '../positionItems/LendItem';
import ListWrap from '../wraps/ListWrap';
import { useAccount } from 'wagmi';
import useSeriesEntities from '../../hooks/useSeriesEntities';

interface IPositionFilter {
  base: IAsset | undefined;
  series: ISeries | undefined;
}

function PositionSelector({ seriesMap, actionType }: { seriesMap: Map<string, ISeries>; actionType: ActionType }) {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext);
  const { data: seriesEntities } = useSeriesEntities(seriesMap);
  const { selectedSeries, selectedBase } = userState;

  const { address: activeAccount } = useAccount();

  const [allPositions, setAllPositions] = useState<ISeries[]>([]);
  const [showAllPositions, setShowAllPositions] = useState<boolean>(false);

  const [currentFilter, setCurrentFilter] = useState<IPositionFilter>();
  const [filterLabels, setFilterLabels] = useState<(string | undefined)[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<ISeries[]>([]);

  const handleFilter = useCallback(
    ({ base, series }: IPositionFilter) => {
      if (!seriesEntities) return;

      /* filter all positions by base if base is selected */
      const _filteredSeries = Array.from(seriesEntities.values())
        /* filter by positive balances on either pool tokens or fyTokens */
        .filter((_series) => (base ? _series.baseId === base.proxyId : true))
        .filter((_series) => (series ? _series.id === series.id : true));
      setCurrentFilter({ base, series });
      setFilterLabels([base?.symbol, series?.displayNameMobile]);
      setFilteredSeries(_filteredSeries);
    },
    [seriesEntities]
  );

  /* CHECK the list of current vaults which match the current base series selection */
  useEffect(() => {
    if (!seriesEntities) return;

    const _allPositions = Array.from(seriesEntities.values())
      /* filter by positive balances on fyTokens */
      .filter((_series) => (actionType === 'LEND' && _series ? _series.fyTokenBalance?.value.gt(ZERO_BN) : true))
      .sort((_seriesA, _seriesB) =>
        actionType === 'LEND' && _seriesA.fyTokenBalance?.value.gt(_seriesB.fyTokenBalance?.value!) ? 1 : -1
      );
    setAllPositions(_allPositions);

    if (selectedBase) handleFilter({ base: selectedBase, series: undefined });
    if (selectedBase && selectedSeries) handleFilter({ base: selectedBase, series: selectedSeries });
  }, [selectedBase, selectedSeries, handleFilter, seriesMap, actionType, seriesEntities]);

  useEffect(() => {
    allPositions.length <= 5 && setShowAllPositions(true);
  }, [allPositions]);

  return (
    <Box justify="end" fill>
      {activeAccount && allPositions.length !== 0 && (
        <Box gap="small">
          <Box
            animation="fadeIn"
            justify="between"
            direction="row"
            gap="small"
            pad={{ horizontal: 'medium', vertical: 'xsmall' }}
          >
            <Text size="small" color="text-weak" textAlign="center">
              {showAllPositions ? `Lending Positions` : `Filtered Lending Positions`}
            </Text>
          </Box>

          <ListWrap overflow="auto">
            {filteredSeries.length === 0 && !showAllPositions && (
              <Text weight={450} size="small">
                No suggested positions
              </Text>
            )}

            {(!showAllPositions ? filteredSeries : allPositions).map((x, i) => (
              <LendItem seriesId={x.id} actionType={actionType} index={i} key={x.id} />
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

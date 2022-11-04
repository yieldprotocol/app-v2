import { useCallback, useContext, useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { Box, Button, Text } from 'grommet';

import { UserContext } from '../../contexts/UserContext';

import { ActionType, IAsset, ISeries, IUserContext, IUserContextState } from '../../types';

import { ZERO_BN } from '../../utils/constants';
import LendItem from '../positionItems/LendItem';
import ListWrap from '../wraps/ListWrap';
import { useAccount } from 'wagmi';

interface IPositionFilter {
  base: IAsset | undefined;
  series: ISeries | undefined;
}

function PositionSelector({ actionType }: { actionType: ActionType }) {
  /* STATE FROM CONTEXT */
  const { userState }: { userState: IUserContextState } = useContext(UserContext) as IUserContext;
  const { seriesMap, selectedSeries, selectedBase } = userState;

  const { address: activeAccount } = useAccount();

  const [allPositions, setAllPositions] = useState<ISeries[]>([]);
  const [showAllPositions, setShowAllPositions] = useState<boolean>(false);

  const [currentFilter, setCurrentFilter] = useState<IPositionFilter>();
  const [filterLabels, setFilterLabels] = useState<(string | undefined)[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<ISeries[]>([]);

  const handleFilter = useCallback(
    ({ base, series }: IPositionFilter) => {
      /* filter all positions by base if base is selected */
      const _filteredSeries: ISeries[] = Array.from(seriesMap?.values()!)
        /* filter by positive balances on either pool tokens or fyTokens */
        .filter((_series: ISeries) => (actionType === 'LEND' && _series ? _series.fyTokenBalance?.gt(ZERO_BN) : true))
        .filter((_series: ISeries) => (actionType === 'POOL' && _series ? _series.poolTokens?.gt(ZERO_BN) : true))
        .filter((_series: ISeries) => (base ? _series.baseId === base.proxyId : true))
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
    const _allPositions: ISeries[] = Array.from(seriesMap?.values()!)
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

            {(!showAllPositions ? filteredSeries : allPositions).map((x: ISeries, i: number) => (
              <LendItem series={x} actionType={actionType} index={i} key={x.id} />
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

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { Box, Button, Text } from 'grommet';

import { UserContext } from '../../contexts/UserContext';
import { IAsset, ISeries, IStrategy, IUserContext } from '../../types';
import { ZERO_BN } from '../../utils/constants';
import StrategyItem from '../positionItems/StrategyItem';
import ListWrap from '../wraps/ListWrap';

interface IStrategyFilter {
  base: IAsset | undefined;
  series: ISeries | undefined;
  strategy: IStrategy | undefined;
}

function StrategyPositionSelector() {

  const history = useHistory();
  
  /* STATE FROM CONTEXT */
  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { assetMap, seriesMap, strategyMap, selectedSeriesId, selectedBaseId, selectedStrategyAddr } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedStrategy = strategyMap.get(selectedStrategyAddr!);

  const [allPositions, setAllPositions] = useState<IStrategy[]>([]);
  const [showAllPositions, setShowAllPositions] = useState<boolean>(false);

  const [currentFilter, setCurrentFilter] = useState<IStrategyFilter>();
  const [filterLabels, setFilterLabels] = useState<(string | undefined)[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<IStrategy[]>([]);

  const handleFilter = useCallback(
    ({ base, series, strategy }: IStrategyFilter) => {
      /* filter all positions by base if base is selected */
      const _filteredStrategies: IStrategy[] = Array.from(strategyMap.values())
        /* filters */
        // .filter((_strategy: IStrategy) => _strategy.balance?.gt(ZERO_BN))
        // .filter((_strategy: IStrategy) => (base ? _strategy.baseId === base.id : true))
        // .filter((_strategy: IStrategy) => (strategy ? _strategy.address === strategy.address : true));

      setCurrentFilter({ base, series, strategy });
      setFilterLabels([base?.symbol, series?.displayNameMobile]);
      setFilteredSeries(_filteredStrategies);
    },
    [strategyMap]
  );

  /* CHECK the list of current vaults which match the current base series selection */
  useEffect(() => {

    /* only if veiwing the main screen (not when modal is showing) */
    const _allPositions: IStrategy[] = Array.from(strategyMap.values())
      /* filter by positive strategy balances */
      .filter((_strategy: IStrategy) => _strategy.accountBalance?.gt(ZERO_BN) )
      .sort((_strategyA: IStrategy, _strategyB: IStrategy) =>
      _strategyA.accountBalance?.lt(_strategyB.accountBalance!) ? 1 : -1
      );
    
    setAllPositions(_allPositions);
    // if (selectedBase) handleFilter({ base: selectedBase, series: undefined });
    // if (selectedBase && selectedSeries) handleFilter({ base: selectedBase, series: selectedSeries });

  }, [strategyMap]);

  useEffect(() => {
    allPositions.length <= 5 && setShowAllPositions(true);
  }, [allPositions]);

  return (
    <Box justify="end" fill >
      {allPositions.length !== 0 && (
        <Box 
          justify="between" 
          alignSelf="end" 
          gap="small" 
          pad="small" 
          background='hover'
          round='xsmall'
        >
          <Box animation="fadeIn" justify="center" align="center" direction="row" gap="small">
            <Text size="small" color="text-weak">
              {showAllPositions
                ? `Open strategy positions`
                : `Filtered strategy positions`}
            </Text>
          </Box>

          <ListWrap overflow="auto" >
            {filteredSeries.length === 0 && !showAllPositions && (
              <Text weight={450} size="small">
                No suggested positions
              </Text>
            )}

            {(!showAllPositions ? filteredSeries : allPositions).map((x: IStrategy, i: number) => (
              <StrategyItem strategy={x} index={i} key={x.address} />
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
                    onClick={() => null
                      // handleFilter({
                      //   ...currentFilter,
                      //   base: undefined,
                      // } as IPositionFilter)
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
                    onClick={() => null
                      // handleFilter({
                      //   ...currentFilter,
                      //   series: undefined,
                      // } as IPositionFilter)
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

export default StrategyPositionSelector;

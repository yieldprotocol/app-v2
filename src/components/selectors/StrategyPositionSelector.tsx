import { useContext, useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { Box, Button, Text } from 'grommet';

import { UserContext } from '../../contexts/UserContext';
import { IStrategy } from '../../types';

import { ZERO_BN } from '../../utils/constants';
import StrategyItem from '../positionItems/StrategyItem';
import ListWrap from '../wraps/ListWrap';
import { useAccount } from 'wagmi';
import useStrategies from '../../hooks/useStrategies';

function StrategyPositionSelector() {
  /* STATE FROM CONTEXT */

  const { userState } = useContext(UserContext);
  const { selectedBase } = userState;
  const { data: strategyMap } = useStrategies();

  const { address: activeAccount } = useAccount();

  const [allPositions, setAllPositions] = useState<IStrategy[]>([]);
  const [showAllPositions, setShowAllPositions] = useState<boolean>(false);

  const [filterLabels] = useState<(string | undefined)[]>([]);
  const [filteredSeries] = useState<IStrategy[]>([]);

  /* CHECK the list of current vaults which match the current base series selection */
  useEffect(() => {
    if (!strategyMap) return;

    /* only if veiwing the main screen (not when modal is showing) */
    const _allPositions = Array.from(strategyMap.values())
      /* filter by positive strategy balances */
      .filter((_strategy) => _strategy.accountBalance?.value.gt(ZERO_BN))
      .sort((_strategyA, _strategyB) =>
        _strategyA.accountBalance?.value.lt(_strategyB.accountBalance?.value!) ? 1 : -1
      );
    setAllPositions(_allPositions);
  }, [strategyMap]);

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
              {showAllPositions ? `Strategy Positions` : `Filtered Strategy Positions`}
            </Text>
          </Box>

          <ListWrap overflow="auto">
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
                  <Text size="xsmall" onClick={() => null}>
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
                  <Text size="xsmall" onClick={() => null}>
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
                  ? `Show suggested ${selectedBase?.displaySymbol || ''} positions only`
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

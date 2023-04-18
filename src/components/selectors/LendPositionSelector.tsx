import { useCallback, useContext, useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { Box, Button, Text } from 'grommet';
import { UserContext } from '../../contexts/UserContext';
import { IAsset, ISeries } from '../../types';
import LendItem from '../positionItems/LendItem';
import ListWrap from '../wraps/ListWrap';
import useAccountPlus from '../../hooks/useAccountPlus';
import useVYTokens from '../../hooks/entities/useVYTokens';
import { BigNumber, ethers } from 'ethers';

interface IPositionFilter {
  base?: IAsset | null;
  id?: string; // fyToken or vyToken address
}

export interface IPosition {
  address: string; // fyToken or vyToken address
  baseId: string; // underlying base id
  displayName: string;
  balance: BigNumber;
}

function LendPositionSelector() {
  const { data: vyTokens } = useVYTokens();
  console.log('🦄 ~ file: LendPositionSelector.tsx:25 ~ LendPositionSelector ~ vyTokens:', vyTokens);

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext);
  const { seriesMap, selectedBase, selectedVR, selectedSeries } = userState;

  const { address: activeAccount } = useAccountPlus();

  const [allPositions, setAllPositions] = useState<IPosition[]>([]);
  const [showAllPositions, setShowAllPositions] = useState<boolean>(false);

  const [currentFilter, setCurrentFilter] = useState<IPositionFilter>();
  const [filterLabels, setFilterLabels] = useState<(string | undefined)[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<IPosition[]>([]);

  const handleFilter = useCallback(
    ({ base, id }: IPositionFilter) => {
      const filtered = allPositions
        // .filter((item) => item.balance.gt(ethers.constants.Zero))
        /* filter all positions by base if base is selected */
        .filter((item) => (base ? item.baseId === base.proxyId : true))
        .filter((item) => (id ? item.address === id : true));

      setCurrentFilter({ base, id });
      setFilterLabels([base?.symbol]);
      setFilteredPositions(filtered);
    },
    [allPositions]
  );

  const handleSort = (positions: IPosition[]) => positions.sort((a, b) => (a.balance.gt(b.balance) ? -1 : 1));

  /* CHECK the list of current vaults which match the current base series selection */
  useEffect(() => {
    (async () => {
      /* only if viewing the main screen (not when modal is showing) */
      const getPositions = async () =>
        activeAccount
          ? [...seriesMap.values()].reduce(async (acc, item) => {
              const position: IPosition = {
                baseId: item.baseId,
                address: item.address,
                balance: ethers.constants.Zero,
                displayName: item.displayName,
              };

              return [...(await acc), position];
            }, Promise.resolve<IPosition[]>([]))
          : [];

      setAllPositions(await getPositions());
    })();
  }, [activeAccount, seriesMap]);

  useEffect(() => {
    handleFilter({
      base: selectedBase,
      id: selectedSeries ? selectedSeries?.id : selectedVR ? selectedBase?.VYTokenProxyAddress : undefined,
    });
  }, [handleFilter, selectedBase, selectedSeries, selectedVR]);

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
            {filteredPositions.length === 0 && !showAllPositions && (
              <Text weight={450} size="small">
                No suggested positions
              </Text>
            )}

            {(!showAllPositions ? filteredPositions : allPositions).map((x, i) => (
              <LendItem item={x} index={i} key={x.address} />
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
                        base: null,
                      })
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

export default LendPositionSelector;

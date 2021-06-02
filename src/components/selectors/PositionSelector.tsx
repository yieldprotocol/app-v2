import { Box, Layer, Text } from 'grommet';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { IAsset, ISeries, IUserContext } from '../../types';
import { ZERO_BN } from '../../utils/constants';
import LendPosition from '../../views/LendPosition';
import ModalWrap from '../wraps/ModalWrap';

interface IPositionFilter {
  base: IAsset| undefined,
  series: ISeries | undefined,
}

function PositionSelector({ type } : { type: 'LEND'|'POOL' }) {
  /* STATE FROM CONTEXT */

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, seriesMap, selectedSeriesId, selectedBaseId } = userState;
  const { setSelectedSeries } = userActions;

  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);

  const [allPositions, setAllPositions] = useState<ISeries[]>([]);
  const [showAllPositions, setShowAllPositions] = useState<boolean>(false);
  const [showPositionModal, setShowPositionModal] = useState<boolean>(false);

  const [currentFilter, setCurrentFilter] = useState<(IPositionFilter)>();
  const [filterLabels, setFilterLabels] = useState<(string|undefined)[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<ISeries[]>([]);

  const handleSelect = (_series:ISeries) => {
    setSelectedSeries(_series.id);
    setShowPositionModal(true);
  };

  const handleFilter = useCallback(
    ({ base, series }: IPositionFilter) => {
      /* filter all positions by base if base is selected */
      const _filteredSeries: ISeries[] = Array.from(seriesMap.values())
      /* filter by positive balances on either pool tokens or fyTokens */
        .filter((_series:ISeries) => ((type === 'LEND' && _series) ? _series.fyTokenBalance?.gt(ZERO_BN) : true))
        .filter((_series:ISeries) => ((type === 'POOL' && _series) ? _series.poolTokens?.gt(ZERO_BN) : true))
        .filter(
          (_series:ISeries) => (base ? _series.baseId === base.id : true),
        )
        .filter(
          (_series:ISeries) => (series ? _series.id === series.id : true),
        );
      setCurrentFilter({ base, series });
      setFilterLabels([base?.symbol, series?.displayNameMobile]);
      setFilteredSeries(_filteredSeries);
    },
    [seriesMap, type],
  );

  /* CHECK the list of current vaults which match the current base series selection */
  useEffect(() => {
    /* only if veiwing the main screen (not when modal is showing) */
    if (!showPositionModal) {
      const _allPositions: ISeries[] = Array.from(seriesMap.values())
      /* filter by positive balances on either pool tokens or fyTokens */
        .filter((_series:ISeries) => ((type === 'LEND' && _series) ? _series.fyTokenBalance?.gt(ZERO_BN) : true))
        .filter((_series:ISeries) => ((type === 'POOL' && _series) ? _series.poolTokens?.gt(ZERO_BN) : true));
      setAllPositions(_allPositions);

      if (selectedBase) handleFilter({ base: selectedBase, series: undefined });
      if (selectedBase && selectedSeries) handleFilter({ base: selectedBase, series: selectedSeries });
    }
  }, [selectedBase, selectedSeries, showPositionModal, handleFilter, seriesMap, type]);

  // useEffect(() => {
  //   !currentFilter?.base &&
  //   !currentFilter?.series &&
  //   setShowAllPositions(true);
  // }, [currentFilter]);

  return (

    <>

      <ModalWrap modalOpen={showPositionModal} toggleModalOpen={() => setShowPositionModal(!showPositionModal)}>
        <LendPosition />
      </ModalWrap>

      <Box
        justify="between"
        alignSelf="end"
        gap="small"
        pad="small"
      >

        <Box animation="fadeIn" justify="end" align="end" direction="row" gap="small">
          <Text size="small" color="text-weak"> { showAllPositions ? 'All my active positions' : 'Suggested existing positions'}</Text>
        </Box>

        {/* {
        allVaults.length === 0 &&
        <Box animation="fadeIn" justify="end" align="end">
          <Text size="small" color="text-weak"> No positions yet</Text>
        </Box>
        } */}

        {
        !showAllPositions &&
        <Box>
          <Box direction="row" gap="small" justify="end" align="center">
            {/* <Text size="xsmall">Filters:</Text> */}
            {
          filterLabels[0] &&
          <Box gap="xsmall" border direction="row" round pad={{ horizontal: 'xsmall', vertical: 'xsmall' }}>
            <Text size="xsmall">{filterLabels[0]}-based</Text>
            <Text
              size="xsmall"
              onClick={() => handleFilter({ ...currentFilter, base: undefined } as IPositionFilter)}
            > x
            </Text>
          </Box>
          }
            {
          filterLabels[1] &&
          <Box gap="xsmall" direction="row" border round pad={{ horizontal: 'xsmall', vertical: 'xsmall' }}>
            <Text size="xsmall">{filterLabels[1]}</Text>
            <Text
              size="xsmall"
              onClick={() => handleFilter({ ...currentFilter, series: undefined } as IPositionFilter)}
            >x
            </Text>
          </Box>
          }
          </Box>
        </Box>
      }

        <Box
          height={{ max: '300px' }}
          style={{ overflow: 'scroll' }}
          gap="small"
          align="end"
        >

          {
            allPositions.length > 0 &&
            filteredSeries.length === 0 &&
            !showAllPositions &&
            <Text weight={450} size="small"> No suggested positions </Text>
          }

          {
          (!showAllPositions ? filteredSeries : allPositions).map((x:ISeries, i:number) => (
            <Box
              key={x.id}
              animation={{ type: 'fadeIn', delay: i * 100, duration: 1500 }}
              hoverIndicator={{ elevation: 'large' }}
              onClick={() => handleSelect(x)}
              pad="xsmall"
              round="xsmall"
            >
              {/* {
                (showAllPositions ? allPositions : filteredSeries).length === 1
              } */}

              <Text weight={450} size="small">  { assetMap.get(x.baseId!)?.symbol} {x.displayName} </Text>

            </Box>
          ))
          }

          {/* <Box gap="small" pad="large">
            <Box pad="xsmall" animation="fadeIn">
              <Text size="xsmall"> Your {selectedBase?.symbol}-based position for the {selectedSeries?.displayName} series: </Text>
              <InfoBite label="FYToken balance (Base value at maturity)" value={selectedSeries?.fyTokenBalance_!} />
            </Box>
            <Box
              direction="row"
              justify="start"
              onClick={() => setShowPositionModal(true)}
              animation={{ type: 'fadeIn', delay: 0, duration: 1500 }}
              border
              pad="xsmall"
              round="xsmall"
            >
              <Text size="xsmall"> Manage Position </Text>
            </Box>
          </Box> */}

        </Box>

        <Box
          pad="xsmall"
          align="end"
          onClick={() => setShowAllPositions(!showAllPositions)}
        >
          <Text size="xsmall">
            {showAllPositions ? `Show suggested ${selectedBase?.symbol || ''} positions only` : `Show all ${allPositions.length} positions`}
          </Text>
        </Box>
      </Box>
    </>
  );
}

export default PositionSelector;

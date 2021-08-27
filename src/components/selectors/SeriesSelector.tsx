import React, { useContext, useEffect, useState } from 'react';
import { Avatar, Box, Carousel, Grid, ResponsiveContext, Select, Stack, Text, ThemeContext } from 'grommet';

import Skeleton from 'react-loading-skeleton';
import { ethers } from 'ethers';
import styled from 'styled-components';
import { FiClock } from 'react-icons/fi';
import { ActionType, ISeries } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { calculateAPR } from '../../utils/yieldMath';
import { useApr } from '../../hooks/useApr';
import YieldMark from '../logos/YieldMark';
import { nFormatter } from '../../utils/appUtils';

const StyledBox = styled(Box)`
-webkit-transition: transform 0.3s ease-in-out;
-moz-transition: transform 0.3s ease-in-out;
transition: transform 0.3s ease-in-out;
background 0.3s ease-in-out;
:hover {
  transform: scale(1.05);
}
:active {
  transform: scale(1);
}
`;

const InsetBox = styled(Box)`
  border-radius: 8px;
  box-shadow: inset 1px 1px 1px #ddd, inset -0.25px -0.25px 0.25px #ddd;
`;

const CardSkeleton = () => (
  <StyledBox
    // border={series.id === selectedSeriesId}
    pad="xsmall"
    round="xsmall"
    elevation="xsmall"
    align="center"
  >
    <Box pad="small" width="small" direction="row" align="center" gap="small">
      <Skeleton circle width={45} height={45} />
      <Box>
        <Skeleton count={2} width={100} />
      </Box>
    </Box>
  </StyledBox>
);

interface ISeriesSelectorProps {
  actionType: ActionType;
  selectSeriesLocally?: (
    series: ISeries
  ) => void /* select series locally filters out the global selection from the list and returns the selected ISeries */;
  inputValue?: string | undefined /* accepts an inpout value for dynamic APR calculations */;
  cardLayout?: boolean;
}

const AprText = ({
  inputValue,
  series,
  actionType,
}: {
  inputValue: string | undefined;
  series: ISeries;
  actionType: ActionType;
}) => {
  const { apr } = useApr(inputValue, actionType, series);

  // const { poolPercent } = usePool(inputValue, series);

  const [limitHit, setLimitHit] = useState<boolean>(false);

  useEffect(() => {
    if (
      !series?.seriesIsMature &&
      inputValue &&
      ethers.utils.parseUnits(inputValue, series.decimals).gt(series.baseReserves)
    ) {
      setLimitHit(true);
    } else {
      setLimitHit(false);
    }
  }, [inputValue, series.baseReserves, series?.seriesIsMature, setLimitHit]);

  return (
    <>
      {actionType !== ActionType.POOL && !series.seriesIsMature && !inputValue && (
        <Text size="medium">
          {series?.apr}% <Text size="xsmall">APR</Text>
        </Text>
      )}

      {actionType !== ActionType.POOL && !limitHit && !series?.seriesIsMature && inputValue && (
        <Text size="medium">
          {apr}% <Text size="xsmall">APR</Text>
        </Text>
      )}

      {actionType !== ActionType.POOL && limitHit && (
        <Text size="xsmall" color="pink">
          low liquidity
        </Text>
      )}

      {actionType === ActionType.POOL && !series.seriesIsMature && !inputValue && (
        <Text size="medium">
          {nFormatter(parseFloat(series?.totalSupply_), 2)} <Text size="xsmall"> liquidity </Text>
        </Text>
      )}

      {actionType === ActionType.POOL && !series.seriesIsMature && inputValue && (
        // TODO fix this asap - use a pool hook
        <Text size="medium">
          {nFormatter((parseFloat(inputValue) / (parseFloat(series?.totalSupply_) + parseFloat(inputValue))) * 100, 2)}
          <Text size="xsmall"> % of Pool</Text>
        </Text>
      )}

      {series.seriesIsMature && (
        <Box direction="row" gap="xsmall" align="center">
          <Text size="xsmall">Mature</Text>
        </Box>
      )}
    </>
  );
};

function SeriesSelector({ selectSeriesLocally, inputValue, actionType, cardLayout }: ISeriesSelectorProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const { userState, userActions } = useContext(UserContext);
  const { selectedSeriesId, selectedBaseId, seriesMap, assetMap, seriesLoading } = userState;
  const [localSeries, setLocalSeries] = useState<ISeries | null>();
  const [options, setOptions] = useState<ISeries[]>([]);

  const selectedSeries = selectSeriesLocally ? localSeries : seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  const optionText = (_series: ISeries | undefined) => {
    if (_series) {
      return `${mobile ? _series.displayNameMobile : _series.displayName}`;
    }
    return 'Select a maturity date';
  };

  const optionExtended = (_series: ISeries | undefined) => (
    <Box fill="horizontal" direction="row" justify="between" gap="small">
      <Box align="center">{_series?.seriesMark} </Box>
      {optionText(_series)}
      {_series?.seriesIsMature && (
        <Box round="large" border pad={{ horizontal: 'small' }}>
          <Text size="xsmall"> Mature </Text>
        </Box>
      )}
      {_series && actionType !== 'POOL' && <AprText inputValue={inputValue} series={_series} actionType={actionType} />}
    </Box>
  );

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts = Array.from(seriesMap.values()) as ISeries[];

    /* filter out options based on base Id and if mature */
    let filteredOpts = opts.filter(
      (_series: ISeries) => _series.baseId === selectedBaseId && !_series.seriesIsMature
      // !ignoredSeries?.includes(_series.baseId)
    );

    /* if required, filter out the globally selected asset and */
    if (selectSeriesLocally) {
      filteredOpts = filteredOpts.filter((_series: ISeries) => _series.id !== selectedSeriesId);
    }

    /* if current selected series is NOT in the list of available series (for a particular base), or bases don't match:
    set the selected series to null. */
    if (
      selectedSeries &&
      (filteredOpts.findIndex((_series: ISeries) => _series.id !== selectedSeriesId) < 0 ||
        selectedSeries.baseId !== selectedBaseId)
    )
      userActions.setSelectedSeries(null);

    setOptions(filteredOpts.sort((a: ISeries, b: ISeries) => a.maturity - b.maturity));
  }, [seriesMap, selectedBase, selectSeriesLocally, selectedSeries, userActions]);

  const handleSelect = (_series: ISeries) => {
    if (!selectSeriesLocally) {
      console.log('Series selected globally: ', _series.id);
      userActions.setSelectedSeries(_series.id);
    } else {
      /* used for passing a selected series to the parent component */
      console.log('Series set locally: ', _series.id);
      selectSeriesLocally(_series);
      setLocalSeries(_series);
    }
  };

  return (
    <>
      {seriesLoading && <Skeleton width={180} />}
      {!cardLayout && (
        <InsetBox fill="horizontal" round="xsmall">
          <Select
            plain
            dropProps={{ round: 'xsmall' }}
            id="seriesSelect"
            name="seriesSelect"
            placeholder="Select Series"
            options={options}
            value={selectedSeries}
            labelKey={(x: any) => optionText(x)}
            valueLabel={
              options.length ? (
                <Box pad={mobile ? 'medium' : '0.55em'}>
                  <Text color="text"> {optionExtended(selectedSeries)}</Text>
                </Box>
              ) : (
                <Box pad={mobile ? 'medium' : '0.55em'}>
                  <Text color="text-weak"> No available series yet.</Text>
                </Box>
              )
            }
            disabled={options.length === 0}
            onChange={({ option }: any) => handleSelect(option)}
            // eslint-disable-next-line react/no-children-prop
            children={(x: any) => (
              <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row">
                <Text color="text"> {optionExtended(x)}</Text>
              </Box>
            )}
          />
        </InsetBox>
      )}

      {cardLayout && (
        <Grid columns={mobile ? '100%' : 'small'} gap="small" fill pad={{ vertical: 'small' }}>
          {seriesLoading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            options.map((series: ISeries) => (
              <StyledBox
                // border={series.id === selectedSeriesId}
                key={series.id}
                pad="xsmall"
                round="xsmall"
                onClick={() => handleSelect(series)}
                background={series.id === selectedSeriesId ? series?.color : undefined}
                elevation="xsmall"
                align="center"
              >
                <Box pad="small" width="small" direction="row" align="center" gap="small">
                  <Avatar background="#FFF"> {series.seriesMark}</Avatar>

                  <Box>
                    <Text size="medium" color={series.id === selectedSeriesId ? series.textColor : undefined}>
                      <AprText inputValue={inputValue} series={series} actionType={actionType} />
                    </Text>
                    <Text size="small" color={series.id === selectedSeriesId ? series.textColor : undefined}>
                      {series.displayName}
                    </Text>
                  </Box>
                </Box>
              </StyledBox>
            ))
          )}
        </Grid>
      )}
    </>
  );
}

SeriesSelector.defaultProps = {
  selectSeriesLocally: null,
  inputValue: undefined,
  cardLayout: true,
};

export default SeriesSelector;

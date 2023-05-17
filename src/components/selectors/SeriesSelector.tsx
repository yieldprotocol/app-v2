import { useContext, useEffect, useState } from 'react';
import { Avatar, Box, Grid, ResponsiveContext, Select, Text } from 'grommet';
import { FiAlertTriangle, FiChevronDown } from 'react-icons/fi';

import { ethers } from 'ethers';
import styled from 'styled-components';

import { maxBaseIn } from '@yield-protocol/ui-math';

import { ActionCodes, ActionType, ISeries } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { useApr } from '../../hooks/useApr';
import { cleanValue } from '../../utils/appUtils';
import Skeleton from '../wraps/SkeletonWrap';
import { SettingsContext } from '../../contexts/SettingsContext';
import useTimeTillMaturity from '../../hooks/useTimeTillMaturity';

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
  border-radius: 100px;
  box-shadow: ${(props) =>
    props.theme.dark
      ? 'inset 1px 1px 1px #202A30, inset -0.25px -0.25px 0.25px #202A30'
      : 'inset 1px 1px 1px #ddd, inset -0.25px -0.25px 0.25px #ddd'};
`;

export const CardSkeleton = (props: { rightSide?: boolean }) => (
  <StyledBox
    pad="xsmall"
    elevation="xsmall"
    align="center"
    round={{ corner: props.rightSide ? 'right' : 'left', size: 'large' }}
  >
    <Box pad="small" width="small" direction="row" align="center" gap="small">
      <Skeleton circle width={45} height={45} />
      <Box>
        <Skeleton count={2} width={100} />
      </Box>
    </Box>
  </StyledBox>
);
CardSkeleton.defaultProps = { rightSide: false };

interface ISeriesSelectorProps {
  actionType: ActionType;
  selectSeriesLocally?: (
    series: ISeries
  ) => void /* select series locally filters out the global selection from the list and returns the selected ISeries */;
  inputValue?: string | undefined /* accepts an inpout value for dynamic APR calculations */;
  cardLayout?: boolean;
  setOpen?: any /* used with modal */;
}

const AprText = ({
  inputValue,
  series,
  actionType,
  color,
}: {
  inputValue: string;
  series: ISeries;
  actionType: ActionType;
  color: string | undefined;
}) => {
  const { getTimeTillMaturity } = useTimeTillMaturity();

  const _inputValue = cleanValue(inputValue, series.decimals);
  const { apr } = useApr(_inputValue, actionType, series);
  const [limitHit, setLimitHit] = useState<boolean>(false);

  const sharesIn = maxBaseIn(
    series.sharesReserves,
    series.fyTokenReserves,
    getTimeTillMaturity(series.maturity),
    series.ts,
    series.g1,
    series.decimals,
    series.c,
    series.mu
  );

  useEffect(() => {
    if (!series?.seriesIsMature && _inputValue)
      actionType === ActionType.LEND
        ? setLimitHit(series.getShares(ethers.utils.parseUnits(_inputValue, series.decimals)).gt(sharesIn)) // lending max
        : setLimitHit(
            series.getShares(ethers.utils.parseUnits(_inputValue, series?.decimals)).gt(series.sharesReserves)
          ); // borrow max
  }, [_inputValue, actionType, series, sharesIn]);

  return (
    <>
      {!series?.seriesIsMature && !limitHit && (
        <Text size="1.2em" color={color}>
          {apr} <Text size="xsmall">% {[ActionType.POOL].includes(actionType) ? 'APY' : 'APR'}</Text>
        </Text>
      )}

      {limitHit && (
        <Text size="xsmall" color="error">
          low liquidity
        </Text>
      )}

      {series.seriesIsMature && (
        <Box direction="row" gap="xsmall" align="center">
          <Text size="xsmall" color={color}>
            Mature
          </Text>
        </Box>
      )}
    </>
  );
};

function SeriesSelector({ selectSeriesLocally, inputValue, actionType, cardLayout, setOpen }: ISeriesSelectorProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);
  const { userState, userActions } = useContext(UserContext);
  const { selectedSeries, selectedBase, seriesMap, seriesLoading, selectedVault } = userState;
  const [localSeries, setLocalSeries] = useState<ISeries | null>();
  const [options, setOptions] = useState<ISeries[]>([]);

  const _selectedSeries = selectSeriesLocally ? localSeries : selectedSeries;

  /* prevent underflow */
  const _inputValue = cleanValue(inputValue, _selectedSeries?.decimals);

  const optionText = (_series: ISeries | undefined) => {
    if (_series) {
      return `${mobile ? _series.displayNameMobile : _series.displayName}`;
    }
    return 'Select a maturity';
  };

  const optionExtended = (_series: ISeries | undefined) => (
    <Box fill="horizontal" direction="row" justify="between" gap="small" align="center">
      <Box align="center">{_series?.seriesMark}</Box>
      {optionText(_series)}
      {_series?.seriesIsMature && (
        <Box round="large" border pad={{ horizontal: 'small' }}>
          <Text size="xsmall">Mature</Text>
        </Box>
      )}
    </Box>
  );

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts = Array.from(seriesMap?.values()!);

    /* filter out options based on base Id ( or proxyId ) and if mature */
    let filteredOpts = opts
      .filter((s) => !s.hideSeries)
      .filter(
        (_series) => _series.baseId === selectedBase?.proxyId && !_series.seriesIsMature
        // !ignoredSeries?.includes(_series.baseId)
      );

    /* if within a position, filter out appropriate series based on selected vault or selected series */
    if (selectSeriesLocally) {
      filteredOpts = opts
        .filter((_series) => _series.baseId === selectedSeries?.baseId && !_series.seriesIsMature) // only use selected series' base
        .filter((_series) => _series.id !== selectedSeries?.id) // filter out current globally selected series
        .filter((_series) => _series.maturity > selectedSeries?.maturity!); // prevent rolling positions to an earlier maturity
    }

    setOptions(filteredOpts.sort((a, b) => a.maturity - b.maturity));
  }, [
    seriesMap,
    selectedBase,
    selectSeriesLocally,
    _selectedSeries,
    userActions,
    selectedSeries,
    actionType,
    selectedVault,
  ]);

  const handleSelect = (_series: ISeries) => {
    if (!selectSeriesLocally) {
      diagnostics && console.log('Series selected globally: ', _series.id);
      userActions.setSelectedSeries(_series);
    } else {
      /* used for passing a selected series to the parent component */
      diagnostics && console.log('Series set locally: ', _series.id);
      selectSeriesLocally(_series);
      setLocalSeries(_series);
    }

    mobile && setOpen(false);
  };

  return (
    <>
      {!selectedBase && <Skeleton width={180} />}
      {!cardLayout && (
        <InsetBox background={mobile ? 'hoverBackground' : undefined}>
          <Select
            plain
            size="small"
            dropProps={{ round: 'large' }}
            id="seriesSelect"
            name="seriesSelect"
            placeholder="Select Series"
            options={options}
            value={_selectedSeries || undefined}
            labelKey={(x: any) => optionText(x)}
            icon={<FiChevronDown />}
            valueLabel={
              options.length ? (
                <Box pad={mobile ? 'medium' : 'small'}>
                  <Text color="text" size="small">
                    {optionExtended(_selectedSeries!)}
                  </Text>
                </Box>
              ) : (
                <Box pad={mobile ? 'medium' : 'small'}>
                  <Text color="text-weak" size="small">
                    No available series yet.
                  </Text>
                </Box>
              )
            }
            disabled={options.length === 0}
            onChange={({ option }: any) => handleSelect(option)}
            // eslint-disable-next-line react/no-children-prop
            children={(x: any) => (
              <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row">
                <Text color="text" size="small">
                  {optionExtended(x)}
                </Text>
              </Box>
            )}
          />
        </InsetBox>
      )}

      {cardLayout && (
        <Grid columns={mobile ? '100%' : '40%'} gap="small">
          {seriesLoading ? (
            <>
              <CardSkeleton />
              <CardSkeleton rightSide />
            </>
          ) : (
            options.map((series: ISeries, i: number) => (
              <StyledBox
                key={series.id}
                pad="xsmall"
                round={
                  // eslint-disable-next-line no-nested-ternary
                  mobile
                    ? 'xlarge'
                    : i % 2 === 0
                    ? { corner: 'left', size: 'large' }
                    : { corner: 'right', size: 'large' }
                }
                onClick={() => handleSelect(series)}
                background={series.id === _selectedSeries?.id ? series?.color : 'hoverBackground'}
                elevation="xsmall"
                align="center"
              >
                <Box pad="small" width="small" direction="row" align="center" gap="small">
                  <Avatar
                    background={
                      series.id === _selectedSeries?.id ? 'lightBackground' : series.endColor.toString().concat('20')
                    }
                    style={{
                      boxShadow:
                        series.id === _selectedSeries?.id
                          ? `inset 1px 1px 2px ${series.endColor.toString().concat('69')}`
                          : undefined,
                    }}
                  >
                    {series.seriesMark}
                  </Avatar>
                  <Box>
                    {
                    series.allowActions.includes('allow_all') ||
                    (series.allowActions.includes(ActionCodes.BORROW) && actionType === ActionType.BORROW) ||
                    (series.allowActions.includes(ActionCodes.LEND) && actionType === ActionType.LEND) ? (
                      <AprText
                        inputValue={_inputValue}
                        series={series}
                        actionType={actionType}
                        color={series.id === _selectedSeries?.id ? series.textColor : undefined}
                      />
                    ) : (
                      <Text size="xsmall" color="red">
                        <FiAlertTriangle /> Restricted
                      </Text>
                    )}

                    <Text
                      size="small"
                      weight="lighter"
                      color={series.id === _selectedSeries?.id ? series.textColor : undefined}
                    >
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
  setOpen: () => null,
};

export default SeriesSelector;

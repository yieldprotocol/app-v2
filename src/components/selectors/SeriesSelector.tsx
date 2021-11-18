import React, { useContext, useEffect, useState } from 'react';
import { Avatar, Box, Grid, ResponsiveContext, Select, Text } from 'grommet';

import { ethers } from 'ethers';
import styled from 'styled-components';
import { ActionType, ISeries, IUserContextActions, IUserContextState } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { maxBaseIn, maxBaseOut } from '../../utils/yieldMath';
import { useApr } from '../../hooks/useApr';
import { cleanValue } from '../../utils/appUtils';
import Skeleton from '../wraps/SkeletonWrap';
import { SettingsContext } from '../../contexts/SettingsContext';

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

const ShadeBox = styled(Box)`
  /* -webkit-box-shadow: inset 0px ${(props) => (props ? '-50px' : '50px')} 30px -30px rgba(0,0,0,0.30); 
  box-shadow: inset 0px ${(props) => (props ? '-50px' : '50px')} 30px -30px rgba(0,0,0,0.30); */
`;

const InsetBox = styled(Box)`
  border-radius: 8px;
  box-shadow: ${(props) =>
    props.theme.dark
      ? 'inset 1px 1px 1px #202A30, inset -0.25px -0.25px 0.25px #202A30'
      : 'inset 1px 1px 1px #ddd, inset -0.25px -0.25px 0.25px #ddd'};
`;

export const CardSkeleton = () => (
  <StyledBox pad="xsmall" round="xsmall" elevation="xsmall" align="center">
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
  setOpen?: any /* used with modal */;
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
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const _inputValue = cleanValue(inputValue, series.decimals);
  const { apr } = useApr(_inputValue, actionType, series);
  const [limitHit, setLimitHit] = useState<boolean>(false);

  const baseIn = maxBaseIn(series.baseReserves, series.fyTokenReserves, series.getTimeTillMaturity(), series.decimals);
  // diagnostics && console.log(series.id, ' maxbaseIn', baseIn.toString());

  useEffect(() => {
    if (!series?.seriesIsMature && _inputValue)
      actionType === ActionType.LEND
        ? setLimitHit(ethers.utils.parseUnits(_inputValue, series?.decimals).gt(baseIn)) // lending max
        : setLimitHit(ethers.utils.parseUnits(_inputValue, series?.decimals).gt(series.baseReserves)); // borrow max
  }, [
    _inputValue,
    actionType,
    baseIn,
    series.baseReserves,
    series?.decimals,
    series?.seriesIsMature,
    setLimitHit,
  ]);

  return (
    <>
      {!series.seriesIsMature && !_inputValue && !limitHit && (
        <Text size="medium">
          {series?.apr}%{' '}
          <Text size="xsmall">{[ActionType.LEND, ActionType.POOL].includes(actionType) ? 'APY' : 'APR'}</Text>
        </Text>
      )}

      {!series?.seriesIsMature && _inputValue && !limitHit && (
        <Text size="medium">
          {apr}% <Text size="xsmall">{[ActionType.LEND, ActionType.POOL].includes(actionType) ? 'APY' : 'APR'}</Text>
        </Text>
      )}

      {limitHit && (
        <Text size="xsmall" color="error">
          low liquidity
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

function SeriesSelector({ selectSeriesLocally, inputValue, actionType, cardLayout, setOpen }: ISeriesSelectorProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } =
    useContext(UserContext);
  const { selectedSeries, selectedBase, seriesMap, seriesLoading } = userState;
  const [localSeries, setLocalSeries] = useState<ISeries | null>();
  const [options, setOptions] = useState<ISeries[]>([]);

  const _selectedSeries = selectSeriesLocally ? localSeries : selectedSeries;

  /* prevent underflow */
  const _inputValue = cleanValue(inputValue, _selectedSeries?.decimals);

  const optionText = (_series: ISeries | undefined) => {
    if (_series) {
      return `${mobile ? _series.displayNameMobile : _series.displayName}`;
    }
    return 'Select a maturity date';
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
      {_series && actionType !== 'POOL' && (
        <AprText inputValue={_inputValue} series={_series} actionType={actionType} />
      )}
    </Box>
  );

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts = Array.from(seriesMap.values()) as ISeries[];

    /* filter out options based on base Id and if mature */
    let filteredOpts = opts
      .filter(
        (_series: ISeries) => _series.baseId === selectedBase?.idToUse && !_series.seriesIsMature
        // !ignoredSeries?.includes(_series.baseId)
      )
      .sort((a: ISeries, b: ISeries) => b.maturity! - a.maturity!);

    /* if required, filter out the globally selected asset and */
    if (selectSeriesLocally) {
      filteredOpts = filteredOpts.filter((_series: ISeries) => _series.id !== _selectedSeries?.id);
    }

    /* if current selected series is NOT in the list of available series (for a particular base), or bases don't match:
    set the selected series to null. */
    if (
      _selectedSeries &&
      _selectedSeries.baseId !== selectedBase?.idToUse // )
    )
      userActions.setSelectedSeries(null);

    setOptions(filteredOpts.sort((a: ISeries, b: ISeries) => a.maturity - b.maturity));
  }, [seriesMap, selectedBase, selectSeriesLocally, _selectedSeries, userActions ]);

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
      {seriesLoading && !mobile && !selectedBase && <Skeleton width={180} />}
      {!cardLayout && (
        <InsetBox fill="horizontal" round="xsmall" background={mobile ? 'hoverBackground' : undefined}>
          <Select
            plain
            dropProps={{ round: 'xsmall' }}
            id="seriesSelect"
            name="seriesSelect"
            placeholder="Select Series"
            options={options}
            value={_selectedSeries!}
            labelKey={(x: any) => optionText(x)}
            valueLabel={
              options.length ? (
                <Box pad={mobile ? 'medium' : '0.55em'}>
                  <Text color="text"> {optionExtended(_selectedSeries!)}</Text>
                </Box>
              ) : (
                <Box pad={mobile ? 'medium' : '0.55em'}>
                  <Text color="text-weak">No available series yet.</Text>
                </Box>
              )
            }
            disabled={options.length === 0}
            onChange={({ option }: any) => handleSelect(option)}
            // eslint-disable-next-line react/no-children-prop
            children={(x: any) => (
              <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row">
                <Text color="text">{optionExtended(x)}</Text>
              </Box>
            )}
          />
        </InsetBox>
      )}

      {cardLayout && (
        <ShadeBox
          overflow={mobile ? 'auto' : 'auto'}
          height={mobile ? undefined : '250px'}
          pad={{ vertical: 'small', horizontal: 'xsmall' }}
        >
          <Grid columns={mobile ? '100%' : '40%'} gap="small">
            {seriesLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                {!mobile && (
                  <>
                    <CardSkeleton />
                    <CardSkeleton />
                  </>
                )}
              </>
            ) : (
              options.map((series: ISeries) => (
                <StyledBox
                  key={series.id}
                  pad="xsmall"
                  round="xsmall"
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
                      <Text size="medium" color={series.id === _selectedSeries?.id ? series.textColor : undefined}>
                        <AprText inputValue={_inputValue} series={series} actionType={actionType} />
                      </Text>
                      <Text size="small" color={series.id === _selectedSeries?.id ? series.textColor : undefined}>
                        {series.displayName}
                      </Text>
                    </Box>
                  </Box>
                </StyledBox>
              ))
            )}
          </Grid>
        </ShadeBox>
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

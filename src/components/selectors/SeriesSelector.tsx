import { useContext, useEffect, useState } from 'react';
import { Avatar, Box, Grid, ResponsiveContext, Select, Text } from 'grommet';
import { FiChevronDown } from 'react-icons/fi';

import { ethers } from 'ethers';
import styled from 'styled-components';

import { maxBaseIn } from '@yield-protocol/ui-math';

import { ActionType, ISeries } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { useApr } from '../../hooks/useApr';
import { cleanValue } from '../../utils/appUtils';
import Skeleton from '../wraps/SkeletonWrap';
import { SettingsContext } from '../../contexts/SettingsContext';
import useTimeTillMaturity from '../../hooks/useTimeTillMaturity';
import useSeriesEntity from '../../hooks/useSeriesEntity';
import SkeletonWrap from '../wraps/SkeletonWrap';
import useSeriesEntities from '../../hooks/useSeriesEntities';
import YieldMark from '../logos/YieldMark';

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
  seriesMap: Map<string, ISeries>;
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
  seriesId,
  actionType,
  color,
}: {
  inputValue: string | undefined;
  seriesId: string;
  actionType: ActionType;
  color: string | undefined;
}) => {
  const { data: seriesEntity } = useSeriesEntity(seriesId);
  const { getTimeTillMaturity } = useTimeTillMaturity();

  const _inputValue = cleanValue(inputValue, seriesEntity?.decimals);
  const { apr } = useApr(_inputValue, actionType, seriesEntity!);
  const [limitHit, setLimitHit] = useState<boolean>(false);

  useEffect(() => {
    if (!seriesEntity) return;

    const { sharesReserves, fyTokenReserves, ts, g1, decimals, c, mu, seriesIsMature, getShares } = seriesEntity;

    const sharesIn = maxBaseIn(
      sharesReserves.value,
      fyTokenReserves.value,
      getTimeTillMaturity(seriesEntity.maturity),
      ts,
      g1,
      decimals,
      c,
      mu
    );

    if (!seriesIsMature && _inputValue)
      actionType === ActionType.LEND
        ? setLimitHit(getShares(ethers.utils.parseUnits(_inputValue, decimals)).gt(sharesIn)) // lending max
        : setLimitHit(getShares(ethers.utils.parseUnits(_inputValue, decimals)).gt(sharesReserves.value)); // borrow max
  }, [_inputValue, actionType, getTimeTillMaturity, seriesEntity]);

  if (!seriesEntity)
    return (
      <Text size="1.2em" color={color}>
        <SkeletonWrap />
      </Text>
    );

  return (
    <>
      {!seriesEntity.seriesIsMature && !limitHit && (
        <Text size="1.2em" color={color}>
          {apr} <Text size="xsmall">% {[ActionType.POOL].includes(actionType) ? 'APY' : 'APR'}</Text>
        </Text>
      )}

      {limitHit && (
        <Text size="xsmall" color="error">
          low liquidity
        </Text>
      )}

      {seriesEntity.seriesIsMature && (
        <Box direction="row" gap="xsmall" align="center">
          <Text size="xsmall" color={color}>
            Mature
          </Text>
        </Box>
      )}
    </>
  );
};

function SeriesSelector({
  seriesMap,
  selectSeriesLocally,
  inputValue,
  actionType,
  cardLayout,
  setOpen,
}: ISeriesSelectorProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);
  const { userState, userActions } = useContext(UserContext);
  const { selectedSeries, selectedBase, selectedVault } = userState;
  const [localSeries, setLocalSeries] = useState<ISeries | null>();
  const [options, setOptions] = useState<ISeries[]>([]);
  const { isMature } = useTimeTillMaturity();

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
      <Box align="center">
        <YieldMark />
      </Box>
      {optionText(_series)}
      {isMature(_series?.maturity!) && (
        <Box round="large" border pad={{ horizontal: 'small' }}>
          <Text size="xsmall">Mature</Text>
        </Box>
      )}
      {_series && actionType !== 'POOL' && (
        <AprText inputValue={_inputValue} seriesId={_series.id} actionType={actionType} color="text" />
      )}
    </Box>
  );

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts = Array.from(seriesMap?.values()!);

    /* filter out options based on base Id ( or proxyId ) and if mature */
    let filteredOpts = opts.filter(
      (_series) => _series.baseId === selectedBase?.proxyId && !isMature(_series.maturity)
    );

    /* if within a position, filter out appropriate series based on selected vault or selected series */
    if (selectSeriesLocally) {
      filteredOpts = opts
        .filter((_series) => _series.baseId === selectedSeries?.baseId && !isMature(_series.maturity)) // only use selected series' base
        .filter((_series) => _series.id !== selectedSeries?.id) // filter out current globally selected series
        .filter((_series) => _series.maturity > selectedSeries?.maturity!); // prevent rolling positions to an earlier maturity
    }

    setOptions(filteredOpts.sort((a, b) => a.maturity - b.maturity));
  }, [
    isMature,
    selectSeriesLocally,
    selectedBase?.proxyId,
    selectedSeries?.baseId,
    selectedSeries?.id,
    selectedSeries?.maturity,
    seriesMap,
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
          {options.map((series, i) => (
            <StyledBox
              key={series.id}
              pad="xsmall"
              round={
                // eslint-disable-next-line no-nested-ternary
                mobile ? 'xlarge' : i % 2 === 0 ? { corner: 'left', size: 'large' } : { corner: 'right', size: 'large' }
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
                  {<YieldMark colors={[series.startColor, series.endColor]} />}
                </Avatar>
                <Box>
                  <AprText
                    inputValue={_inputValue}
                    seriesId={series.id}
                    actionType={actionType}
                    color={series.id === _selectedSeries?.id ? series.textColor : undefined}
                  />
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
          ))}
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

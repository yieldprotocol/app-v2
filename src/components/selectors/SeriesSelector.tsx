import { useContext, useEffect, useState } from 'react';
import { Avatar, Box, Grid, ResponsiveContext, Select, Text } from 'grommet';
import { FiChevronDown } from 'react-icons/fi';

import { ethers } from 'ethers';
import styled from 'styled-components';

import { ActionType, ISeriesRoot } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { useApr } from '../../hooks/useApr';
import { cleanValue } from '../../utils/appUtils';
import Skeleton from '../wraps/SkeletonWrap';
import { SettingsContext } from '../../contexts/SettingsContext';
import useSeriesEntities from '../../hooks/useSeriesEntities';
import YieldMark from '../logos/YieldMark';
import SkeletonWrap from '../wraps/SkeletonWrap';
import { useLendHelpers } from '../../hooks/viewHelperHooks/useLendHelpers';

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
    series: ISeriesRoot
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
  inputValue: string;
  seriesId: string;
  actionType: ActionType;
  color: string | undefined;
}) => {
  const {
    seriesEntity: { data: series, isLoading },
  } = useSeriesEntities(seriesId);

  const _inputValue = cleanValue(inputValue || '0', series?.decimals);
  const parsedInputValue = ethers.utils.parseUnits(_inputValue, series?.decimals);
  const { apr } = useApr(_inputValue, actionType, series?.id!);
  const { maxLend } = useLendHelpers(series!, inputValue);
  const [limitHit, setLimitHit] = useState<boolean>(false);

  useEffect(() => {
    if (!series?.seriesIsMature && series)
      actionType === ActionType.LEND
        ? setLimitHit(series.getShares(ethers.utils.parseUnits(_inputValue, series.decimals)).gt(series.sharesReserves)) // lending max
        : setLimitHit(
            series.getShares(ethers.utils.parseUnits(_inputValue, series?.decimals)).gt(series.sharesReserves)
          ); // borrow max
  }, [_inputValue, actionType, maxLend, parsedInputValue, series]);

  return (
    <>
      {!series?.seriesIsMature && !limitHit && (
        <Text size="1.2em" color={color}>
          {isLoading ? (
            <SkeletonWrap />
          ) : (
            <>
              {apr} <Text size="xsmall">% {[ActionType.POOL].includes(actionType) ? 'APY' : 'APR'}</Text>
            </>
          )}
        </Text>
      )}

      {limitHit && (
        <Text size="xsmall" color="error">
          low liquidity
        </Text>
      )}

      {series?.seriesIsMature && (
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
  const { selectedSeriesId, selectedBase } = userState;
  const {
    seriesEntities: { data: seriesMap },
  } = useSeriesEntities();
  const [localSeries, setLocalSeries] = useState<ISeriesRoot | null>();
  const [options, setOptions] = useState<ISeriesRoot[]>([]);

  const _selectedSeries = selectSeriesLocally ? localSeries : seriesMap?.get(selectedSeriesId!);

  /* prevent underflow */
  const _inputValue = cleanValue(inputValue, _selectedSeries?.decimals);

  const optionText = (_series: ISeriesRoot) => `${mobile ? _series.displayNameMobile : _series.displayName}`;

  const optionExtended = (_series: ISeriesRoot) => (
    <Box fill="horizontal" direction="row" justify="between" gap="small" align="center">
      <Box align="center">
        <YieldMark colors={[_series.startColor, _series.endColor]} />
      </Box>
      {optionText(_series)}
      {_series?.seriesIsMature && (
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
    if (!seriesMap) return;

    const opts = Array.from(seriesMap.values());

    /* filter out options based on base Id ( or proxyId ) and if mature */
    let filteredOpts = opts
      .filter((s) => s.showSeries)
      .filter((s) => s.baseId === selectedBase?.proxyId && !s.seriesIsMature);
    console.log('🦄 ~ file: SeriesSelector.tsx:176 ~ useEffect ~ filteredOpts:', filteredOpts);

    /* if within a position, filter out appropriate series based on selected vault or selected series */
    if (selectSeriesLocally) {
      filteredOpts = opts
        .filter((s) => s.baseId === _selectedSeries?.baseId && !s.seriesIsMature) // only use selected series' base
        .filter((s) => s.id !== _selectedSeries?.id) // filter out current globally selected series
        .filter((s) => s.maturity > _selectedSeries?.maturity!); // prevent rolling positions to an earlier maturity
    }

    setOptions(filteredOpts.sort((a, b) => a.maturity - b.maturity));
  }, [
    selectSeriesLocally,
    selectedBase?.proxyId,
    _selectedSeries?.baseId,
    _selectedSeries?.id,
    _selectedSeries?.maturity,
    seriesMap,
  ]);

  const handleSelect = (_series: ISeriesRoot) => {
    if (!selectSeriesLocally) {
      diagnostics && console.log('Series selected globally: ', _series.id);
      userActions.setSelectedSeriesId(_series.id);
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
                  <YieldMark colors={[series.startColor, series.endColor]} />
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

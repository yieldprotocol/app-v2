import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text, ThemeContext } from 'grommet';

import { ISeries } from '../../types';
import { UserContext } from '../../contexts/UserContext';

interface ISeriesSelectorProps {
  /* select series locally filters out the global selection from the list and returns the selected ISeries */
  selectSeriesLocally?: (series: ISeries) => void;
}

function SeriesSelector({ selectSeriesLocally }: ISeriesSelectorProps) {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');

  const { userState, userActions } = useContext(UserContext);
  const { selectedSeriesId, selectedBaseId, seriesMap, assetMap } = userState;
  const [localSeries, setLocalSeries] = useState<ISeries|null>();
  const [options, setOptions] = useState<ISeries[]>([]);

  const selectedSeries = selectSeriesLocally ? localSeries : seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  const optionText = (_series: ISeries|undefined) => (
    _series
      ? `${mobile ? _series.displayNameMobile : _series.displayName}  ● APR: ${_series.APR}%`
      : 'Select a series'
  );

  const optionExtended = (_series: ISeries|undefined) => (
    <Box fill="horizontal" direction="row" justify="between" gap="small">
      {optionText(_series)}
      { _series?.mature &&
        <Box round="large" border pad={{ horizontal: 'small' }}>
          <Text size="xsmall"> Mature </Text>
        </Box>}
    </Box>
  );

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts = Array.from(seriesMap.values()) as ISeries[];

    /* filter out options based on base Id */
    let filteredOpts = opts.filter((_series:ISeries) => _series.baseId === selectedBaseId);

    /* if required, filter out the globally selected asset */
    if (selectSeriesLocally) filteredOpts = filteredOpts.filter((_series:ISeries) => _series.id !== selectedSeriesId);

    /* if current selected series is NOT in the list of available series (for a particular base), or bases don't match:
    set the selected series to null. */
    if (
      selectedSeries &&
      (filteredOpts.findIndex((_series:ISeries) => _series.id !== selectedSeriesId) < 0 ||
      selectedSeries.baseId !== selectedBaseId)
    ) userActions.setSelectedSeries(null);

    setOptions(filteredOpts);
  }, [seriesMap, selectedBase, selectSeriesLocally, selectedSeries, userActions]);

  const handleSelect = (_series:ISeries) => {
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
    <Box fill="horizontal" border round="xsmall">
      <Select
        plain
        id="seriesSelect"
        name="assetSelect"
        placeholder="Select Series"
        options={options}
        value={selectedSeries}
        labelKey={(x:any) => optionText(x)}
        valueLabel={
          options.length ?
            <Box pad={mobile ? 'medium' : 'small'}><Text color="text"> {optionExtended(selectedSeries)}</Text></Box>
            : <Box pad={mobile ? 'medium' : 'small'}><Text color="text"> No available series.</Text></Box>
        }
        disabled={options.length === 0}
        onChange={({ option }: any) => handleSelect(option)}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row"> <Text color="text"> { optionExtended(x) }</Text> </Box>}
      />
    </Box>
  );
}

SeriesSelector.defaultProps = { selectSeriesLocally: null };

export default SeriesSelector;

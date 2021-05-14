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
  const { selectedSeriesId, selectedBaseId, seriesMap } = userState;
  const [localSeriesId, setLocalSeriesId] = useState<string>();
  const [options, setOptions] = useState<ISeries[]>([]);

  /* get from seriesBaseMap (not seriesMap) so it can be used without an account connected */
  const _selectedSeries = selectSeriesLocally ? seriesMap.get(localSeriesId) : seriesMap.get(selectedSeriesId);

  const optionText = (_series: ISeries|undefined) => (
    _series
      ? `${mobile ? _series.displayNameMobile : _series.displayName}  ● APR: ${_series.APR}%`
      : 'Select a series'
  );

  useEffect(() => {
    const opts = Array.from(seriesMap.values()) as ISeries[];
    /* filter out options based on base Id */
    let filteredOpts = opts.filter((_series:ISeries) => _series.baseId === selectedBaseId);
    /* if required, filter out the globally selected asset */
    if (selectSeriesLocally) filteredOpts = filteredOpts.filter((_series:ISeries) => _series.id !== selectedSeriesId);
    /* if there are no options available, set the selected series to null. */
    if (selectedSeriesId && !filteredOpts.length) userActions.setSelectedSeries(null);
    setOptions(filteredOpts);
  }, [seriesMap, selectedBaseId, selectSeriesLocally, selectedSeriesId, userActions]);

  const handleSelect = (id:string) => {
    if (!selectSeriesLocally) {
      console.log('Series selected globally: ', id);
      userActions.setSelectedSeries(id);
    } else {
      /* used for passing a selected series to the parent component */
      console.log('Series set locally: ', id);
      selectSeriesLocally(seriesMap.get(id));
      setLocalSeriesId(id);
    }
  };

  return (
    <Box fill>
      <Select
        id="seriesSelect"
        name="assetSelect"
        placeholder="Select Series"
        options={options}
        value={_selectedSeries}
        labelKey={(x:any) => optionText(x)}
        valueLabel={
          options.length ?
            <Box pad={mobile ? 'medium' : 'small'}><Text size="small" color="text"> {optionText(_selectedSeries)} </Text></Box>
            : <Box pad={mobile ? 'medium' : 'small'}><Text size="small" color="text"> No available series.</Text></Box>
        }
        disabled={options.length === 0}
        onChange={({ option }: any) => handleSelect(option.id)}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row"> <Text color="text" size="small"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

SeriesSelector.defaultProps = { selectSeriesLocally: null };

export default SeriesSelector;

import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text, ThemeContext } from 'grommet';

import { ISeries } from '../../types';
import { UserContext } from '../../contexts/UserContext';

interface ISeriesSelectorProps {
  globalSelect?:boolean;
}

function SeriesSelector({ globalSelect }: ISeriesSelectorProps) {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');

  const { userState, userActions } = useContext(UserContext);
  const { selectedSeriesId, selectedBaseId, seriesMap } = userState;
  const [options, setOptions] = useState<ISeries[]>([]);

  /* get from seriesBaseMap (not seriesMap) so it can be used without an account connected */
  const _selectedSeries = seriesMap.get(selectedSeriesId);

  const optionText = (_series: ISeries|undefined) => (
    _series
      ? `${mobile ? _series.displayNameMobile : _series.displayName}  ● APR: ${_series.APR}%`
      : 'Select a series'
  );

  useEffect(() => {
    const opts = Array.from(seriesMap.values()) as ISeries[];
    const filteredOpts = opts.filter((_series:ISeries) => _series.baseId === selectedBaseId);
    setOptions(filteredOpts);
  }, [seriesMap, selectedBaseId]);

  const handleSelect = (id:string) => {
    if (globalSelect) {
      console.log('Series selected globally: ', id);
      globalSelect && userActions.setSelectedSeries(id);
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

SeriesSelector.defaultProps = { globalSelect: true };

export default SeriesSelector;

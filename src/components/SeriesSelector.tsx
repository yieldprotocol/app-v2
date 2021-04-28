import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text, ThemeContext } from 'grommet';

import { ChainContext } from '../contexts/ChainContext';
import { ISeriesData } from '../types';
import { UserContext } from '../contexts/UserContext';

function SeriesSelector() {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const { chainState: { seriesMap } } = useContext(ChainContext);

  const { userState, userActions } = useContext(UserContext);
  const { selectedVaultId, selectedSeriesId, selectedBaseId } = userState;
  const [options, setOptions] = useState<ISeriesData[]>([]);

  /* get from seriesMap (not seriesData) so it can be used without an account connected */
  const _selectedSeries = seriesMap.get(selectedSeriesId);

  const optionText = (_series: ISeriesData|undefined) => (
    _series
      ? `${mobile ? _series.displayNameMobile : _series.displayName}  ● APR: ${_series.APR}%`
      : 'Select a series'
  );

  useEffect(() => {
    const opts = Array.from(seriesMap.values()) as ISeriesData[];
    const filteredOpts = opts.filter((_series:ISeriesData) => _series.baseId === selectedBaseId);
    setOptions(filteredOpts);
  }, [seriesMap, selectedBaseId]);

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
        disabled={options.length === 0 || !!selectedVaultId}
        onChange={({ option }: any) => userActions.setSelectedSeries(option.id)}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row"> <Text color="text" size="small"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

export default SeriesSelector;

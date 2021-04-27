import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text, ThemeContext } from 'grommet';

import { ChainContext } from '../contexts/ChainContext';
import { ISeriesData } from '../types';
import { UserContext } from '../contexts/UserContext';

function SeriesSelector() {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const { chainState: { seriesMap } } = useContext(ChainContext);

  const { userState, userActions } = useContext(UserContext);
  const { activeVault, selectedSeries, selectedBase, seriesData } = userState;
  const [options, setOptions] = useState<ISeriesData[]>([]);

  const optionText = (series: ISeriesData|undefined) => (
    series
      ? `${mobile ? series.displayNameMobile : series.displayName}  ● APR: ${series.APR}%`
      : 'Select a series'
  );

  useEffect(() => {
    const opts = Array.from(seriesData.values()) as ISeriesData[];
    const filteredOpts = opts.filter((series:ISeriesData) => series.baseId === selectedBase.id);
    setOptions(filteredOpts);
  }, [seriesData, selectedBase]);

  useEffect(() => {
    activeVault?.series && userActions.setSelectedSeries(activeVault.series);
  }, [activeVault, userActions]);

  return (
    <Box fill>
      <Select
        id="seriesSelect"
        name="assetSelect"
        placeholder="Select Series"
        options={options}
        value={selectedSeries}
        labelKey={(x:any) => optionText(x)}
        valueLabel={
          options.length ?
            <Box pad={mobile ? 'medium' : 'small'}><Text size="small" color="text"> {optionText(selectedSeries)} </Text></Box>
            : <Box pad={mobile ? 'medium' : 'small'}><Text size="small" color="text"> No available series.</Text></Box>
        }
        disabled={options.length === 0 || !!activeVault}
        onChange={({ option }: any) => userActions.setSelectedSeries(option)}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row"> <Text color="text" size="small"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

export default SeriesSelector;

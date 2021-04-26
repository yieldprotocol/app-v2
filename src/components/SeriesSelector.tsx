import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text, ThemeContext } from 'grommet';

import { ChainContext } from '../contexts/ChainContext';
import { ISeries } from '../types';
import { UserContext } from '../contexts/UserContext';

function SeriesSelector() {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const { chainState: { seriesMap } } = useContext(ChainContext);

  const { userState, userActions } = useContext(UserContext);
  const { activeVault, selectedSeries, selectedIlk, selectedBase } = userState;

  const [options, setOptions] = useState<ISeries[]>([]);

  const optionText = (series: ISeries|undefined) => (
    series
      ? `${mobile ? series.displayNameMobile : series.displayName}  ● APR: ${series.apr}%`
      : 'Select a series'
  );

  useEffect(() => {
    const opts = Array.from(seriesMap.values()) as ISeries[];
    const filteredOpts = opts.filter((series:ISeries) => series.baseId === selectedBase.id);
    setOptions(filteredOpts);
  }, [seriesMap, selectedBase, selectedIlk]);

  useEffect(() => {
    activeVault?.series && userActions.setSelectedSeries(activeVault.series);
  }, [activeVault]);

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

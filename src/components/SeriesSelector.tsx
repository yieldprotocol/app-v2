import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text, ThemeContext } from 'grommet';

import { ChainContext } from '../contexts/ChainContext';
import { IYieldSeries } from '../types';
import { UserContext } from '../contexts/UserContext';

function SeriesSelector() {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const { chainState: { seriesMap }, chainActions } = useContext(ChainContext);

  const { userState: { selectedSeries, selectedIlk, selectedBase }, userActions } = useContext(UserContext);
  const [currentSeries, setCurrentSeries] = useState<IYieldSeries>();

  const [options, setOptions] = useState<IYieldSeries[]>([]);
  const optionText = (series: IYieldSeries|undefined) => `${mobile ? series?.displayNameMobile : series?.displayName}  ● APR: ${series?.apr}%` || '';

  useEffect(() => {
    const opts = Array.from(seriesMap.values()) as IYieldSeries[];
    const filteredOpts = opts.filter((series:IYieldSeries) => series.baseId === selectedBase.id);
    console.log(filteredOpts);
    setOptions(filteredOpts);
  }, [seriesMap, selectedBase, selectedIlk]);

  useEffect(() => {
    if (selectedSeries) {
      setCurrentSeries(selectedSeries);
    } else {
      userActions.setSelectedSeries(options[0]);
    }
  }, [selectedSeries, options, userActions]);

  return (
    <Box fill>
      <Select
        id="seriesSelect"
        name="assetSelect"
        placeholder="Select Series"
        options={options}
        value={currentSeries}
        labelKey={(x:any) => optionText(x)}
        valueLabel={
          options.length ?
            <Box pad={mobile ? 'medium' : 'small'}><Text size="small" color="text"> {optionText(currentSeries)} </Text></Box>
            : <Box pad={mobile ? 'medium' : 'small'}><Text size="small" color="text"> No available series.</Text></Box>
        }
        disabled={options.length === 0}
        onChange={({ option }: any) => userActions.setSelectedSeries(option)}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row"> <Text color="text" size="small"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

export default SeriesSelector;

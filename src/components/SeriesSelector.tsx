import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text, ThemeContext } from 'grommet';

import { VaultContext } from '../contexts/VaultContext';
import { IYieldSeries } from '../types';

function SeriesSelector() {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const { vaultState: { seriesMap, activeSeries }, vaultActions } = useContext(VaultContext);
  const [options, setOptions] = useState<IYieldSeries[]>([]);
  const optionText = (series: IYieldSeries) => `${series?.displayName}  ● APR: ${series?.apr}%` || '';

  useEffect(() => {
    const opts = Array.from(seriesMap.values()) as IYieldSeries[];
    setOptions(opts);
  }, [activeSeries, seriesMap]);

  return (
    <Box fill>
      <Select
        id="seriesSelect"
        name="assetSelect"
        placeholder="Select Series"
        options={options}
        // defaultValue={activeSeries}
        value={activeSeries}
        labelKey={(x:any) => optionText(x)}
        valueLabel={<Box pad={mobile ? 'medium' : 'small'}><Text size="small" color="text"> {optionText(activeSeries)} </Text></Box>}
        onChange={({ option }: any) => vaultActions.setActiveSeries(option)}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row"> <Text color="text" size="small"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

export default SeriesSelector;

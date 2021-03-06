import React, { useContext, useEffect, useState } from 'react';
import { Box, Select, Text, ThemeContext } from 'grommet';

import { SeriesContext } from '../contexts/SeriesContext';
import { IYieldSeries } from '../types';

function SeriesSelector() {
  const { seriesState: { seriesMap, activeSeries }, seriesActions } = useContext(SeriesContext);

  const options: any[] = Array.from(seriesMap.values());

  const optionText = (series: IYieldSeries) => `${series.displayName}  ● APR: ${series.apr}%`;

  return (
    <Box fill>
      <Select
        id="seriesSelect"
        name="assetSelect"
        placeholder="Select Series"
        options={options}
        defaultValue={activeSeries}
        value={activeSeries}
        labelKey={(x:any) => optionText(x)}
        onChange={({ option }: any) => seriesActions.setActiveSeries(option)}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad="small" gap="small" direction="row"> <Text color="text"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

export default SeriesSelector;

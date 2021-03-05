import { Box, Select } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { SeriesContext } from '../contexts/SeriesContext';

function SeriesSelector() {
  const { seriesState: { seriesMap, activeSeries }, seriesActions } = useContext(SeriesContext);
  return (
    <Box fill>
      <Select
        options={Array.from(seriesMap.values()).map((x:any) => x.displayName)}
        value={activeSeries}
        onChange={({ option }: any) => seriesActions.setActiveSeries(option)}
      />
    </Box>
  );
}

export default SeriesSelector;

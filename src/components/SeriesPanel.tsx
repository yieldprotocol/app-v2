import { Box, Text } from 'grommet';
import React, { useContext, useState } from 'react';
import { UserContext } from '../contexts/UserContext';
import { IUserContext } from '../types';
import SeriesSelector from './selectors/SeriesSelector';

interface ISeriesPanel {
  children: any;
}

function SeriesPanel({ children }: ISeriesPanel) {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, vaultMap, seriesMap, selectedSeriesId, selectedIlkId, selectedBaseId } = userState;

  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedIlk = assetMap.get(selectedIlkId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);

  const [minApr, setMinApr] = useState<string>('2.34');

  return (
    <Box fill justify="between" pad="small">
      <Box fill align="center" justify="center" basis="75%">
        <Text size="xsmall"> Borrow {selectedBase?.symbol} </Text>
        <Text size="xlarge"> {!selectedSeries && 'from'} {selectedSeries?.APR || minApr}% </Text>
        {/* <SeriesSelector /> */}
      </Box>
      <Box>
        {children}
      </Box>
    </Box>

  );
}

export default SeriesPanel;

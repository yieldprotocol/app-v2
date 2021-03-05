import React, { useContext, useEffect, useState } from 'react';
import { Box, Select, Text } from 'grommet';

import { IYieldSeries } from '../types';

const assetMap = new Map([
  ['DAI', { name: 'Dai', symbol: 'DAI', icon: null }],
  ['USD', { name: 'USD Coin', symbol: 'USDC', icon: null }],
  ['DOGE', { name: 'Doge Coin', symbol: 'DOGE', icon: null }],
  ['UNI', { name: 'Uni coin', symbol: 'UNI', icon: null }],
]);

const AssetOption = ({ symbol, icon }: any) => (
  <Box pad="small">
    <Text color="text"> {symbol} </Text>
  </Box>
);

function AssetSelector() {
  // const { seriesState: { seriesMap, activeSeries }, seriesActions } = useContext(SeriesContext);
  const [selectedAsset, setSelectedAsset] = useState(assetMap.get('DAI'));
  const options: any[] = Array.from(assetMap.values());
  const optionText = (asset: any) => asset.symbol;
  // .map((x:any) => <AssetOption asset={x.symbol} icon={x.icon} key={x.name} />);

  return (
    <Box fill>

      <Select
        id="assetSelectc"
        name="assetSelect"
        placeholder="Select Asset"
        options={options}
        defaultValue={selectedAsset}
        value={selectedAsset}
        labelKey={(x:any) => optionText(x)}
        onChange={({ option }: any) => setSelectedAsset(option)}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad="small" gap="small" direction="row"> <Text color="text"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

export default AssetSelector;

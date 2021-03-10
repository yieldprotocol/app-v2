import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text } from 'grommet';

import { IYieldAsset } from '../types';

const assetMap = new Map([
  ['DAI', { name: 'Dai', symbol: 'DAI', icon: null }],
  ['USD', { name: 'USD Coin', symbol: 'USDC', icon: null }],
  ['DOGE', { name: 'Doge Coin', symbol: 'DOGE', icon: null }],
  ['UNI', { name: 'Uni coin', symbol: 'UNI', icon: null }],
]);

function AssetSelector() {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  // const { vaultState: { seriesMap, activeSeries }, seriesActions } = useContext(VaultProvider);
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
        // defaultValue={selectedAsset}
        value={selectedAsset}
        labelKey={(x:any) => optionText(x)}
        valueLabel={<Box pad={mobile ? 'medium' : 'small'}><Text size="small" color="text"> {optionText(selectedAsset)} </Text></Box>}
        onChange={({ option }: any) => setSelectedAsset(option)}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row"> <Text color="text" size="small"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

export default AssetSelector;

import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text } from 'grommet';

import { IYieldAsset } from '../types';
import { ChainContext } from '../contexts/ChainContext';

// const _assetMap = new Map([
//   ['DAI', { name: 'Dai', symbol: 'DAI', icon: null }],
//   ['USD', { name: 'USD Coin', symbol: 'USDC', icon: null }],
//   ['DOGE', { name: 'Doge Coin', symbol: 'DOGE', icon: null }],
//   ['UNI', { name: 'Uni coin', symbol: 'UNI', icon: null }],
// ]);

function AssetSelector() {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const { chainState: { assetMap, activeAsset }, chainActions } = useContext(ChainContext);

  const [options, setOptions] = useState<IYieldAsset[]>([]);
  const optionText = (asset: IYieldAsset) => `${asset?.symbol}` || '';

  useEffect(() => {
    const opts = Array.from(assetMap.values()) as IYieldAsset[];
    setOptions(opts);
  }, [activeAsset, assetMap]);

  return (
    <Box fill>
      <Select
        id="assetSelectc"
        name="assetSelect"
        placeholder="Select Asset"
        options={options}
        // defaultValue={selectedAsset}
        value={activeAsset}
        labelKey={(x:any) => optionText(x)}
        valueLabel={<Box pad={mobile ? 'medium' : 'small'}><Text size="small" color="text"> { optionText(activeAsset)} </Text></Box>}
        onChange={({ option }: any) => chainActions.setActiveAsset(option)}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row"> <Text color="text" size="small"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

export default AssetSelector;

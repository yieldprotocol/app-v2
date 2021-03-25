import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text } from 'grommet';

import { IYieldAsset } from '../types';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';

// const _assetMap = new Map([
//   ['DAI', { name: 'Dai', symbol: 'DAI', icon: null }],
//   ['USD', { name: 'USD Coin', symbol: 'USDC', icon: null }],
//   ['DOGE', { name: 'Doge Coin', symbol: 'DOGE', icon: null }],
//   ['UNI', { name: 'Uni coin', symbol: 'UNI', icon: null }],
// ]);
interface IAssetSelectorProps {
  selectCollateral?:boolean;
}

function AssetSelector({ selectCollateral }: IAssetSelectorProps) {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const { chainState: { assetMap }, chainActions } = useContext(ChainContext);
  const { userState: { selectedIlk, selectedSeries, selectedBase }, userActions } = useContext(UserContext);

  const [options, setOptions] = useState<IYieldAsset[]>([]);
  const optionText = (asset: IYieldAsset | undefined) => `${asset?.symbol}` || '';

  useEffect(() => {
    const opts = Array.from(assetMap.values()) as IYieldAsset[];

    const filteredOptions = selectCollateral
      ? opts.filter((a:IYieldAsset) => a.id !== selectedBase.id)
      : opts;
    setOptions(filteredOptions);
  }, [selectedBase, assetMap, selectCollateral]);

  return (
    <Box fill>
      <Select
        id="assetSelectc"
        name="assetSelect"
        placeholder="Select Asset"
        options={options}
        value={selectCollateral ? selectedIlk : selectedBase}
        labelKey={(x:any) => optionText(x)}
        valueLabel={<Box pad={mobile ? 'medium' : 'small'}><Text size="small" color="text"> { optionText(selectCollateral ? selectedIlk : selectedBase)} </Text></Box>}
        onChange={({ option }: any) => {
          selectCollateral ? userActions.setSelectedIlk(option) : userActions.setSelectedBase(option);
        }}
        disabled={selectCollateral && !selectedSeries}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row"> <Text color="text" size="small"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

AssetSelector.defaultProps = { selectCollateral: false };

export default AssetSelector;

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

  const [currentAsset, setCurrentAsset] = useState<IYieldAsset>();

  useEffect(() => {
    const opts = Array.from(assetMap.values()) as IYieldAsset[];
    const filteredOptions = selectCollateral ? opts : opts; // TODO fix this filtereing

    setOptions(opts);
  }, [currentAsset, assetMap, selectCollateral]);

  useEffect(() => {
    !selectCollateral && setCurrentAsset(selectedBase);
  }, [selectCollateral, selectedBase, selectedIlk, options]);

  return (
    <Box fill>
      <Select
        id="assetSelectc"
        name="assetSelect"
        placeholder="Select Asset"
        options={options}
        value={currentAsset}
        labelKey={(x:any) => optionText(x)}
        valueLabel={<Box pad={mobile ? 'medium' : 'small'}><Text size="small" color="text"> { optionText(currentAsset)} </Text></Box>}
        onChange={({ option }: any) => {
          selectCollateral ? userActions.setSelectedIlk(option) : userActions.setSelectedBase(option);
        }}
        disabled={selectCollateral && selectedSeries === null}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row"> <Text color="text" size="small"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

AssetSelector.defaultProps = { selectCollateral: false };

export default AssetSelector;

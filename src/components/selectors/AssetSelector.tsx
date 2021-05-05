import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text } from 'grommet';

import { IAssetRoot } from '../../types';
import { UserContext } from '../../contexts/UserContext';

// const _assetRootMap = new Map([
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
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlkId, selectedSeriesId, selectedBaseId, assetMap } = userState;

  /* get from assetRootMap ( not assetMap ) so it can be used without account connected */
  const selectedIlk = assetMap.get(selectedIlkId);
  const selectedBase = assetMap.get(selectedBaseId);

  const [options, setOptions] = useState<IAssetRoot[]>([]);
  const optionText = (asset: IAssetRoot | undefined) => `${asset?.symbol}` || '';

  useEffect(() => {
    const opts = Array.from(assetMap.values()) as IAssetRoot[];
    const filteredOptions = selectCollateral
      ? opts.filter((a:IAssetRoot) => a.id !== selectedBaseId)
      : opts;
    setOptions(filteredOptions);
  }, [selectedBaseId, assetMap, selectCollateral]);

  const handleSelect = (id:string) => {
    if (selectCollateral) {
      console.log('Collateral selected: ', id);
      userActions.setSelectedIlk(id);
    } else {
      console.log('Base selected: ', id);
      userActions.setSelectedBase(id);
    }
  };

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
        onChange={({ option }: any) => handleSelect(option.id)}
        disabled={(selectCollateral && !selectedSeriesId)}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row"> <Text color="text" size="small"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

AssetSelector.defaultProps = { selectCollateral: false };

export default AssetSelector;

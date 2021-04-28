import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text } from 'grommet';

import { unstable_renderSubtreeIntoContainer } from 'react-dom';
import { IAssetStatic } from '../types';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';

// const _assetStaticData = new Map([
//   ['DAI', { name: 'Dai', symbol: 'DAI', icon: null }],
//   ['USD', { name: 'USD Coin', symbol: 'USDC', icon: null }],
//   ['DOGE', { name: 'Doge Coin', symbol: 'DOGE', icon: null }],
//   ['UNI', { name: 'Uni coin', symbol: 'UNI', icon: null }],
// ]);
interface IAssetStaticSelectorProps {
  selectCollateral?:boolean;
}

function AssetSelector({ selectCollateral }: IAssetStaticSelectorProps) {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const { chainState: { assetStaticData } } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { selectedVaultId, selectedIlkId, selectedSeriesId, selectedBaseId } = userState;

  /* get from assetStaticData ( not assetData ) so it can be used without account connected */
  const selectedIlk = assetStaticData.get(selectedIlkId);
  const selectedBase = assetStaticData.get(selectedBaseId);

  const [options, setOptions] = useState<IAssetStatic[]>([]);
  const optionText = (asset: IAssetStatic | undefined) => `${asset?.symbol}` || '';

  useEffect(() => {
    const opts = Array.from(assetStaticData.values()) as IAssetStatic[];
    const filteredOptions = selectCollateral
      ? opts.filter((a:IAssetStatic) => a.id !== selectedBaseId)
      : opts;
    setOptions(filteredOptions);
  }, [selectedBaseId, assetStaticData, selectCollateral]);

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
          selectCollateral ? userActions.setSelectedIlk(option.id) : userActions.setSelectedBase(option.id);
        }}
        disabled={(selectCollateral && !selectedSeriesId) || (!selectCollateral && !!selectedVaultId)}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row"> <Text color="text" size="small"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

AssetSelector.defaultProps = { selectCollateral: false };

export default AssetSelector;

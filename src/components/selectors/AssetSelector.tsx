import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text } from 'grommet';
import Loader from 'react-spinners/ScaleLoader';

import { IAsset, IAssetRoot } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { DAI, WETH } from '../../utils/constants';

interface IAssetSelectorProps {
  selectCollateral?:boolean;
}

function AssetSelector({ selectCollateral }: IAssetSelectorProps) {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlk, selectedSeries, selectedBase, assetMap } = userState;

  const [options, setOptions] = useState<IAssetRoot[]>([]);
  const optionText = (asset: IAssetRoot | undefined) => (asset?.symbol ? `${asset?.symbol}` : <Loader height="14" color="lightgrey" margin="0.5" />);

  const handleSelect = (asset:IAsset) => {
    if (selectCollateral) {
      console.log('Collateral selected: ', asset.id);
      userActions.setSelectedIlk(asset);
    } else {
      console.log('Base selected: ', asset.id);
      userActions.setSelectedBase(asset);
    }
  };

  /* update options on any changes */
  useEffect(() => {
    const opts = Array.from(assetMap.values()) as IAssetRoot[];
    const filteredOptions = selectCollateral
      ? opts.filter((a:IAssetRoot) => a.id !== selectedBase?.id)
      : opts;
    setOptions(filteredOptions);
  }, [selectedBase, assetMap, selectCollateral, selectedSeries]);

  /* initiate base selector to Dai available asset and selected ilk ETH */
  useEffect(() => {
    if (Array.from(assetMap.values()).length) {
      userActions.setSelectedBase(assetMap.get(DAI));
      userActions.setSelectedIlk(assetMap.get(WETH));
    }
  }, [assetMap]);

  // /* TODO make sure ilk (collateral) never matches baseId */
  // useEffect(() => {
  //   if (selectCollateral && selectedSeries && selectedIlk) {
  //     const firstNotBase = options.find((asset:IAssetRoot) => asset.id !== selectedSeries.baseId)?.id;
  //     userActions.setSelectedIlk(firstNotBase);
  //     // userActions.setSelectedIlk(options.find((asset:IAssetRoot) => asset.id !== selectedSeries.baseId))
  //   }
  // }, [options, selectCollateral, selectedIlk, selectedSeries, userActions]);

  return (
    <Box
      fill
      round="xsmall"
      border={(selectCollateral && !selectedSeries) ? { color: 'text-xweak' } : true}
    >
      <Select
        plain
        id="assetSelectc"
        name="assetSelect"
        placeholder="Select Asset"
        options={options}
        value={selectCollateral ? selectedIlk : selectedBase}
        labelKey={(x:any) => optionText(x)}
        valueLabel={<Box pad={mobile ? 'medium' : 'small'}><Text color="text"> { optionText(selectCollateral ? selectedIlk : selectedBase)} </Text></Box>}
        onChange={({ option }: any) => handleSelect(option)}
        disabled={(selectCollateral && !selectedSeries)}
        // eslint-disable-next-line react/no-children-prop
        children={(x:any) => <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row"> <Text color="text"> { optionText(x) } </Text> </Box>}
      />
    </Box>
  );
}

AssetSelector.defaultProps = { selectCollateral: false };

export default AssetSelector;

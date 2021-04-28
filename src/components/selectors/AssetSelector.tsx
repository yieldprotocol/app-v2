import React, { useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text } from 'grommet';

import { IassetRoot } from '../../types';
import { UserContext } from '../../contexts/UserContext';

// const _assetRootMap = new Map([
//   ['DAI', { name: 'Dai', symbol: 'DAI', icon: null }],
//   ['USD', { name: 'USD Coin', symbol: 'USDC', icon: null }],
//   ['DOGE', { name: 'Doge Coin', symbol: 'DOGE', icon: null }],
//   ['UNI', { name: 'Uni coin', symbol: 'UNI', icon: null }],
// ]);
interface IassetRootSelectorProps {
  selectCollateral?:boolean;
}

function AssetSelector({ selectCollateral }: IassetRootSelectorProps) {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const { userState, userActions } = useContext(UserContext);
  const { selectedVaultId, selectedIlkId, selectedSeriesId, selectedBaseId, assetMap } = userState;

  /* get from assetRootMap ( not assetMap ) so it can be used without account connected */
  const selectedIlk = assetMap.get(selectedIlkId);
  const selectedBase = assetMap.get(selectedBaseId);

  const [options, setOptions] = useState<IassetRoot[]>([]);
  const optionText = (asset: IassetRoot | undefined) => `${asset?.symbol}` || '';

  useEffect(() => {
    const opts = Array.from(assetMap.values()) as IassetRoot[];
    const filteredOptions = selectCollateral
      ? opts.filter((a:IassetRoot) => a.id !== selectedBaseId)
      : opts;
    setOptions(filteredOptions);
  }, [selectedBaseId, assetMap, selectCollateral]);

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

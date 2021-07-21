import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Box, ResponsiveContext, Select, Text } from 'grommet';
import Loader from 'react-spinners/ScaleLoader';

import styled from 'styled-components';
import { IAsset, IAssetRoot } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { DAI, WETH } from '../../utils/constants';

interface IAssetSelectorProps {
  selectCollateral?: boolean;
}

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;

  :hover {
    transform: scale(1.025);
  }
`;

function AssetSelector({ selectCollateral }: IAssetSelectorProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlkId, selectedSeriesId, selectedBaseId, assetMap, seriesMap } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedIlk = assetMap.get(selectedIlkId!);

  const [options, setOptions] = useState<IAssetRoot[]>([]);
  const optionText = (asset: IAssetRoot | undefined) =>
    asset?.symbol ? (
      <Box direction="row" align="center" gap="xsmall">
        {' '}
        <Box flex={false}>{asset.image}</Box>
        {asset?.symbol}
      </Box>
    ) : (
      <Loader height="14px" color="lightgrey" margin="0.5px" />
    );

  const handleSelect = (asset: IAsset) => {
    if (selectCollateral) {
      console.log('Collateral selected: ', asset.id);
      userActions.setSelectedIlk(asset.id);
    } else {
      console.log('Base selected: ', asset.id);
      userActions.setSelectedBase(asset.id);
    }
  };

  /* update options on any changes */
  useEffect(() => {
    const opts = Array.from(assetMap.values()) as IAsset[];
    const filteredOptions = 
      selectCollateral ? 
      opts.filter((a: IAsset) => a.id !== selectedBaseId) 
      : opts.filter((a: IAsset) => a.isYieldBase );
    setOptions(filteredOptions);
  }, [assetMap, selectCollateral, selectedSeriesId, selectedBaseId]);

  /* initiate base selector to Dai available asset and selected ilk ETH */
  useEffect(() => {
    if (Array.from(assetMap.values()).length) {
      !selectedBaseId && userActions.setSelectedBase(assetMap.get(DAI).id);
      !selectedIlkId && userActions.setSelectedIlk(assetMap.get(WETH).id);
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
    <StyledBox
      fill
      round="xsmall"
      // border={(selectCollateral && !selectedSeries) ? { color: 'text-xweak' } : true}
      elevation="xsmall"
    >
      <Select
        plain
        dropProps={{ round:'xsmall' }}
        id="assetSelectc"
        name="assetSelect"
        placeholder="Select Asset"
        options={options}
        value={selectCollateral ? selectedIlk : selectedBase}
        labelKey={(x: IAssetRoot | undefined) => optionText(x)}
        valueLabel={
          <Box pad={mobile ? 'medium' : { vertical: '0.55em', horizontal: 'xsmall' }}>
            <Text color="text"> {optionText(selectCollateral ? selectedIlk : selectedBase)} </Text>
          </Box>
        }
        onChange={({ option }: any) => handleSelect(option)}
        disabled={
          selectCollateral ? selectedSeries?.mature || !selectedSeries : null // [ ]
          // ( options.map((x:any, i:number) => {
          //   if (x.isYieldBase) { return i }
          //   return null
          // }
          // ).filter( (x:number|null) => { console.log(x); return isNull(x) } )
        }
        
        // eslint-disable-next-line react/no-children-prop
        children={(x: any) => (
          <Box pad={mobile ? 'medium' : 'small'} gap="xsmall" direction="row">
            <Text color="text"> {optionText(x)} </Text>
          </Box>
        )}
      />
    </StyledBox>
  );
}

AssetSelector.defaultProps = { selectCollateral: false };

export default AssetSelector;

import React, { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Box, ResponsiveContext, Select, Text } from 'grommet';

import Skeleton from 'react-loading-skeleton';

import styled from 'styled-components';
import { IAsset } from '../../types';
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
  const { selectedIlkId, selectedSeriesId, selectedBaseId, assetMap, seriesMap, activeAccount, diagnostics } =
    userState;

  const { setSelectedIlk, setSelectedBase } = userActions;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedIlk = assetMap.get(selectedIlkId!);

  const [options, setOptions] = useState<IAsset[]>([]);
  const optionText = (asset: IAsset | undefined) =>
    asset?.symbol ? (
      <Box direction="row" align="center" gap="xsmall">
        <Box flex={false}>{asset.image}</Box>
        {asset?.symbol}
      </Box>
    ) : (
      <Skeleton width={50} />
    );

  const handleSelect = (asset: IAsset) => {
    if (selectCollateral) {
      diagnostics && console.log('Collateral selected: ', asset.id);
      setSelectedIlk(asset.id);
    } else {
      diagnostics && console.log('Base selected: ', asset.id);
      setSelectedBase(asset.id);
    }
  };

  /* update options on any changes */
  useEffect(() => {
    const opts = Array.from(assetMap.values()) as IAsset[];
    let filteredOptions;
    if (!activeAccount) {
      filteredOptions = selectCollateral
        ? opts.filter((a: IAsset) => a.id !== selectedBaseId) // show all available collateral assets if the user is not connected
        : opts.filter((a: IAsset) => a.isYieldBase);
    } else {
      filteredOptions = selectCollateral
        ? opts
            .filter((a: IAsset) => a.id !== selectedBaseId)
            .filter((a: IAsset) => a.balance?.gt(ethers.constants.Zero))
        : opts.filter((a: IAsset) => a.isYieldBase);
    }
    setOptions(filteredOptions);
  }, [assetMap, selectCollateral, selectedSeriesId, selectedBaseId, activeAccount]);

  /* initiate base selector to Dai available asset and selected ilk ETH */
  useEffect(() => {
    if (Array.from(assetMap.values()).length) {
      !selectedBaseId && setSelectedBase(DAI);
      !selectedIlkId && setSelectedIlk(WETH);
    }
  }, [assetMap, selectedBaseId, selectedIlkId]);

  /* make sure ilk (collateral) never matches baseId */
  useEffect(() => {
    if (selectedIlk === selectedBase) {
      const firstNotBaseIlk = options.find((asset: IAsset) => asset.id !== selectedIlk?.id)?.id;
      setSelectedIlk(firstNotBaseIlk);
    }
  }, [options, selectedIlk, selectedBase]);

  return (
    <StyledBox
      fill="horizontal"
      round="xsmall"
      // border={(selectCollateral && !selectedSeries) ? { color: 'text-xweak' } : true}
      elevation="xsmall"
      background="solid"
    >
      <Select
        plain
        dropProps={{ round: 'xsmall' }}
        id="assetSelectc"
        name="assetSelect"
        placeholder="Select Asset"
        options={options}
        value={selectCollateral ? selectedIlk : selectedBase}
        labelKey={(x: IAsset | undefined) => optionText(x)}
        valueLabel={
          <Box pad={mobile ? 'medium' : { vertical: '0.55em', horizontal: 'small' }}>
            <Text color="text"> {optionText(selectCollateral ? selectedIlk : selectedBase)} </Text>
          </Box>
        }
        onChange={({ option }: any) => handleSelect(option)}
        disabled={
          (selectCollateral && options.filter((o, i) => (o.balance?.eq(ethers.constants.Zero) ? i : null))) ||
          (selectCollateral ? selectedSeries?.mature || !selectedSeries : null)

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

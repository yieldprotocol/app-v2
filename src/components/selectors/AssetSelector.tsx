import React, { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Box, ResponsiveContext, Select, Text } from 'grommet';

import styled from 'styled-components';
import Skeleton from '../wraps/SkeletonWrap';
import { IAsset, IUserContext, IUserContextActions, IUserContextState } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { WETH, USDC, IGNORE_BASE_ASSETS } from '../../config/assets';
import { SettingsContext } from '../../contexts/SettingsContext';

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

  const {
    settingsState: { showWrappedTokens, diagnostics },
  } = useContext(SettingsContext);

  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;
  const { assetMap, activeAccount, selectedIlk, selectedBase, selectedSeries } = userState;

  const { setSelectedIlk, setSelectedBase } = userActions;

  const [options, setOptions] = useState<IAsset[]>([]);

  const optionText = (asset: IAsset | undefined) =>
    asset ? (
      <Box direction="row" align="center" gap="xsmall">
        <Box flex={false}>{asset.image}</Box>
        {asset?.displaySymbol}
      </Box>
    ) : (
      <Skeleton width={50} />
    );

  const handleSelect = (asset: IAsset) => {
    if (selectCollateral) {
      diagnostics && console.log('Collateral selected: ', asset.id);
      setSelectedIlk(asset);
    } else {
      diagnostics && console.log('Base selected: ', asset.id);
      setSelectedBase(asset);
    }
  };

  /* update options on any changes */
  useEffect(() => {
    const opts: IAsset[] = Array.from(assetMap.values())
      .filter((a: IAsset) => a.showToken) // filter based on whether wrapped tokens are shown or not
      .filter((a: IAsset) => (showWrappedTokens ? true : !a.isWrappedToken)); // filter based on whether wrapped tokens are shown or not

    const filteredOptions = selectCollateral
        ? opts.filter((a: IAsset) => a.id !== selectedBase?.id) // show all available collateral assets if the user is not connected
        : opts.filter((a: IAsset) => a.isYieldBase).filter((a: IAsset) => !IGNORE_BASE_ASSETS.includes(a.id));

    setOptions(filteredOptions);
  }, [assetMap, selectCollateral, selectedSeries, selectedBase, activeAccount]);

  /* initiate base selector to USDC available asset and selected ilk ETH */
  useEffect(() => {
    if (Array.from(assetMap.values()).length) {
      !selectedBase && setSelectedBase(assetMap.get(USDC)!);
      !selectedIlk && setSelectedIlk(assetMap.get(WETH)!);
    }
  }, [assetMap, selectedBase, selectedIlk]);

  /* make sure ilk (collateral) never matches baseId */
  useEffect(() => {
    if (selectedIlk?.id === selectedBase?.id) {
      console.log('base matches ilk');
      // const firstNotBaseIlk = options.find((asset: IAsset) => asset.id !== selectedIlk?.id);
      // setSelectedIlk(firstNotBaseIlk!);
    }
  }, [options, selectedIlk, selectedBase, setSelectedIlk]);

  return (
    <StyledBox
      fill="horizontal"
      round="xsmall"
      // border={(selectCollateral && !selectedSeries) ? { color: 'text-xweak' } : true}
      elevation="xsmall"
      background="hoverBackground"
    >
      <Select
        plain
        dropProps={{ round: 'xsmall' }}
        id="assetSelectc"
        name="assetSelect"
        placeholder="Select Asset"
        options={options}
        value={selectCollateral ? selectedIlk! : selectedBase!}
        labelKey={(x: IAsset | undefined) => optionText(x)}
        valueLabel={
          <Box pad={mobile ? 'medium' : { vertical: '0.55em', horizontal: 'small' }}>
            <Text color="text"> {optionText(selectCollateral ? selectedIlk! : selectedBase!)} </Text>
          </Box>
        }
        onChange={({ option }: any) => handleSelect(option)}
        disabled={
          (selectCollateral && options.filter((o, i) => (o.balance?.eq(ethers.constants.Zero) ? i : null))) ||
          (selectCollateral ? selectedSeries?.seriesIsMature || !selectedSeries : undefined)
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

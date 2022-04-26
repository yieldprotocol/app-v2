import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Avatar, Box, ResponsiveContext, Select, Text, ThemeContext } from 'grommet';

import styled, { ThemeConsumer } from 'styled-components';
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
  const theme = useContext<any>(ThemeContext);

  const {
    settingsState: { showWrappedTokens, diagnostics },
  } = useContext(SettingsContext);

  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;
  const { assetMap, activeAccount, selectedIlk, selectedBase, selectedSeries } = userState;

  const { setSelectedIlk, setSelectedBase, setSelectedSeries } = userActions;
  const [options, setOptions] = useState<IAsset[]>([]);

  const optionText = (asset: IAsset | undefined) =>
    asset ? (
      <Box direction="row" align="center" gap="xsmall" >
        <Avatar size='xsmall' background={theme.dark ? 'text': undefined }> {asset.image} </Avatar>
        
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
      setSelectedSeries(null);
    }
  };

  /* update options on any changes */
  useEffect(() => {
    const opts = Array.from(assetMap.values())
      .filter((a) => a.showToken) // filter based on whether wrapped tokens are shown or not
      .filter((a) => (showWrappedTokens ? true : !a.isWrappedToken)); // filter based on whether wrapped tokens are shown or not

    const filteredOptions = selectCollateral
      ? opts
          .filter((a) => a.proxyId !== selectedBase?.proxyId) // show all available collateral assets if the user is not connected except selectedBase
          .filter((a) => (a.limitToSeries?.length ? a.limitToSeries.includes(selectedSeries!.id) : true)) // if there is a limitToSeries list (length > 0 ) then only show asset if list has the seriesSelected.
      : opts.filter((a) => a.isYieldBase).filter((a) => !IGNORE_BASE_ASSETS.includes(a.proxyId));

    setOptions(filteredOptions);
  }, [assetMap, selectCollateral, selectedSeries, selectedBase, activeAccount, showWrappedTokens]);

  /* initiate base selector to USDC available asset and selected ilk ETH */
  useEffect(() => {
    if (Array.from(assetMap.values()).length) {
      !selectedBase && setSelectedBase(assetMap.get(USDC)!);
      !selectedIlk && setSelectedIlk(assetMap.get(WETH)!);
    }
  }, [assetMap, selectedBase, selectedIlk, setSelectedBase, setSelectedIlk]);

  /* make sure ilk (collateral) never matches baseId */
  useEffect(() => {
    if (selectedIlk?.proxyId === selectedBase?.proxyId) {
      const firstNotBaseIlk = options.find((asset: IAsset) => asset.proxyId !== selectedIlk?.proxyId);
      setSelectedIlk(firstNotBaseIlk!);
    }
  }, [options, selectedIlk, selectedBase, setSelectedIlk]);

  return (
    <StyledBox
      fill="horizontal"
      round={mobile ? 'large' : { corner: 'right', size: 'large' }}
      elevation="xsmall"
      background="hoverBackground"
    >
      <Select
        plain
        dropProps={{ round: 'small' }}
        id="assetSelect"
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

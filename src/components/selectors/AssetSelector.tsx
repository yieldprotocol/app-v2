import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Box, ResponsiveContext, Select, Text } from 'grommet';

import { FiChevronDown, FiMoreVertical } from 'react-icons/fi';

import styled from 'styled-components';
import Skeleton from '../wraps/SkeletonWrap';
import { IAsset } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { WETH, USDC, IGNORE_BASE_ASSETS } from '../../config/assets';
import { SettingsContext } from '../../contexts/SettingsContext';
import AssetSelectModal from './AssetSelectModal';
import Logo from '../logos/Logo';
import { GA_Event, GA_Properties } from '../../types/analytics';
import useAnalytics from '../../hooks/useAnalytics';
import useAssets from '../../hooks/useAssets';
import useSeriesEntity from '../../hooks/useSeriesEntity';
import useTimeTillMaturity from '../../hooks/useTimeTillMaturity';

interface IAssetSelectorProps {
  selectCollateral?: boolean;
  isModal?: boolean;
}

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;

  :hover {
    transform: scale(1.025);
  }
`;

function AssetSelector({ selectCollateral, isModal }: IAssetSelectorProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    settingsState: { showWrappedTokens, diagnostics },
  } = useContext(SettingsContext);

  const { userState, userActions } = useContext(UserContext);
  const { selectedIlk, selectedBase, selectedSeries } = userState;
  const { data: assetMap } = useAssets();

  const { isMature } = useTimeTillMaturity();
  const { setSelectedIlk, setSelectedBase, setSelectedSeries, setSelectedStrategy } = userActions;
  const [options, setOptions] = useState<IAsset[]>([]);
  const [modalOpen, toggleModal] = useState<boolean>(false);

  const { logAnalyticsEvent } = useAnalytics();

  const optionText = (asset: IAsset | undefined) =>
    asset ? (
      <Box direction="row" align="center" gap="small">
        <Logo image={asset.image} />
        <Text color="text" size="small">
          {asset?.displaySymbol}
        </Text>
      </Box>
    ) : (
      <Skeleton width={50} />
    );

  const handleSelect = (asset: IAsset) => {
    if (selectCollateral) {
      diagnostics && console.log('Collateral selected: ', asset.id);
      setSelectedIlk(asset);
      logAnalyticsEvent(GA_Event.collateral_selected, {
        asset: asset.symbol,
      } as GA_Properties.collateral_selected);
    } else {
      diagnostics && console.log('Base selected: ', asset.id);
      setSelectedBase(asset);
      setSelectedSeries(null);

      setSelectedStrategy(null);

      logAnalyticsEvent(GA_Event.asset_selected, {
        asset: asset.symbol,
      } as GA_Properties.asset_selected);
    }
  };

  /* update options on any changes */
  useEffect(() => {
    if (!assetMap) return;

    const opts = Array.from(assetMap.values())
      .filter((a) => a?.showToken) // filter based on whether wrapped tokens are shown or not
      .filter((a) => (showWrappedTokens ? true : !a.isWrappedToken)); // filter based on whether wrapped tokens are shown or not

    const filteredOptions = selectCollateral
      ? opts
          .filter((a) => a.proxyId !== selectedBase?.proxyId) // show all available collateral assets if the user is not connected except selectedBase
          .filter((a) => (a.limitToSeries?.length ? a.limitToSeries.includes(selectedSeries!.id) : true)) // if there is a limitToSeries list (length > 0 ) then only show asset if list has the seriesSelected.
      : opts.filter((a) => a.isYieldBase).filter((a) => !IGNORE_BASE_ASSETS.includes(a.proxyId));

    setOptions(filteredOptions);
  }, [assetMap, selectCollateral, selectedBase?.proxyId, selectedSeries, showWrappedTokens]);

  /* initiate base selector to USDC available asset and selected ilk ETH */
  useEffect(() => {
    if (!assetMap) return;

    if (Array.from(assetMap?.values()!).length) {
      !selectedBase && setSelectedBase(assetMap?.get(USDC)!);
      !selectedIlk && setSelectedIlk(assetMap?.get(WETH)!);
    }
  }, [assetMap, selectedBase, selectedIlk, setSelectedBase, setSelectedIlk]);

  /* make sure ilk (collateral) never matches baseId */
  useEffect(() => {
    if (selectedIlk?.proxyId === selectedBase?.proxyId) {
      const firstNotBaseIlk = options.find((asset) => asset.proxyId !== selectedIlk?.proxyId);
      setSelectedIlk(firstNotBaseIlk!);
    }
  }, [options, selectedIlk, selectedBase, setSelectedIlk]);

  /* set ilk to be USDC if ETH base */
  useEffect(() => {
    if (selectedBase?.proxyId === WETH || selectedBase?.id === WETH) {
      setSelectedIlk(assetMap?.get(USDC) || null);
    }
  }, [assetMap, selectedBase, setSelectedIlk]);

  return (
    <StyledBox
      fill="horizontal"
      round={mobile ? 'large' : { corner: 'right', size: 'large' }}
      elevation="xsmall"
      background="hoverBackground"
      onClick={() => isModal && toggleModal(!modalOpen)}
    >
      {isModal && modalOpen && (
        <AssetSelectModal assets={options} handleSelect={handleSelect} open={modalOpen} setOpen={toggleModal} />
      )}
      {!modalOpen && (
        <Select
          plain
          dropProps={{ round: 'small' }}
          id="assetSelect"
          name="assetSelect"
          placeholder="Select Asset"
          options={options}
          // value={selectCollateral ? selectedIlk! : selectedBase!}
          labelKey={(x: IAsset | undefined) => optionText(x)}
          valueLabel={
            <Box pad={mobile ? 'medium' : { vertical: '0.55em', horizontal: 'small' }}>
              {optionText(selectCollateral ? selectedIlk! : selectedBase!)}
            </Box>
          }
          icon={isModal ? <FiMoreVertical /> : <FiChevronDown />}
          onChange={({ option }: any) => handleSelect(option)}
          disabled={
            (selectCollateral && options.filter((o, i) => (o.balance.value.eq(ethers.constants.Zero) ? i : null))) ||
            (selectCollateral ? isMature(selectedSeries?.maturity!) || !selectedSeries : undefined)
          }
          size="small"
          // eslint-disable-next-line react/no-children-prop
          children={(x: any) => (
            <Box pad={mobile ? 'medium' : 'small'} gap="xsmall" direction="row">
              {optionText(x)}
            </Box>
          )}
        />
      )}
    </StyledBox>
  );
}

AssetSelector.defaultProps = { selectCollateral: false };

export default AssetSelector;

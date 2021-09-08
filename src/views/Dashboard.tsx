import React, { useContext, useState, useCallback, useEffect } from 'react';
import { Box, CheckBox, DropButton, ResponsiveContext, Text } from 'grommet';
import { ethers } from 'ethers';
import { FiChevronDown, FiTool } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ActionType, IUserContext, IVault, ISeries } from '../types';
import YieldInfo from '../components/YieldInfo';
import DashboardPositionList from '../components/DashboardPositionList';
import DashboardBalanceSummary from '../components/DashboardBalanceSummary';
import MainViewWrap from '../components/wraps/MainViewWrap';
import PanelWrap from '../components/wraps/PanelWrap';
import HideBalancesSetting from '../components/HideBalancesSetting';
import CurrencyToggle from '../components/CurrencyToggle';
import { ZERO_BN, DAI, WETH } from '../utils/constants';
import { cleanValue } from '../utils/appUtils';

const Dashboard = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const {
    chainState: { account, chainLoading },
  } = useContext(ChainContext);
  const {
    userState: {
      seriesMap,
      vaultMap,
      showInactiveVaults,
      hideBalancesSetting,
      priceMap,
      currencySetting,
      vaultsLoading,
      seriesLoading,
      pricesLoading,
    },
  } = useContext(UserContext) as IUserContext;

  const [vaultPositions, setVaultPositions] = useState<IVault[]>([]);
  const [lendPositions, setLendPositions] = useState<ISeries[]>([]);
  const [poolPositions, setPoolPositions] = useState<ISeries[]>([]);
  const [allPositions, setAllPositions] = useState<(ISeries | IVault)[]>([]);
  const [showEmpty, setShowEmpty] = useState<boolean>(false);
  const [totalDebt, setTotalDebt] = useState<string | null>(null);
  const [totalCollateral, setTotalCollateral] = useState<string | null>(null);
  const [totalLendBalance, setTotalLendBalance] = useState<string | null>(null);
  const [totalPoolBalance, setTotalPoolBalance] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const currencySettingAssetId = currencySetting === 'ETH' ? WETH : DAI;
  const currencySettingDigits = currencySetting === 'ETH' ? 4 : 2;
  const currencySettingSymbol = currencySetting === 'ETH' ? 'Ξ' : '$';

  useEffect(() => {
    const _vaultPositions: IVault[] = Array.from(vaultMap.values())
      .filter((vault: IVault) => showInactiveVaults || vault.isActive)
      .filter((vault: IVault) => (showEmpty ? true : vault.ink.gt(ZERO_BN) || vault.art.gt(ZERO_BN)))
      .sort((vaultA: IVault, vaultB: IVault) => (vaultA.art.lt(vaultB.art) ? 1 : -1));
    setVaultPositions(_vaultPositions);
  }, [vaultMap, showInactiveVaults, showEmpty, hideBalancesSetting]);

  useEffect(() => {
    const _lendPositions: ISeries[] = Array.from(seriesMap.values())
      .filter((_series: ISeries) => (_series ? _series.fyTokenBalance?.gt(ZERO_BN) : true))
      .filter((_series: ISeries) =>
        hideBalancesSetting ? Number(_series.fyTokenBalance_!) > Number(hideBalancesSetting) : true
      )
      .sort((_seriesA: ISeries, _seriesB: ISeries) => (_seriesA.fyTokenBalance?.lt(_seriesB.fyTokenBalance!) ? 1 : -1));
    setLendPositions(_lendPositions);

    const _poolPositions: ISeries[] = Array.from(seriesMap.values())
      .filter((_series: ISeries) => (_series ? _series.poolTokens?.gt(ZERO_BN) : true))
      .filter((_series: ISeries) =>
        hideBalancesSetting ? Number(_series.poolTokens_!) > Number(hideBalancesSetting) : true
      )
      .sort((_seriesA: ISeries, _seriesB: ISeries) => (_seriesA.fyTokenBalance?.gt(_seriesB.fyTokenBalance!) ? 1 : -1));
    setPoolPositions(_poolPositions);
  }, [seriesMap, hideBalancesSetting]);

  useEffect(() => {
    setAllPositions([...vaultPositions, ...lendPositions, ...poolPositions]);
  }, [vaultPositions, lendPositions, poolPositions]);

  /* get a single position's ink or art in dai or eth (input the asset id): value can be art, ink, fyToken, or pooToken balances */
  const getPositionValue = useCallback(
    (baseOrIlkId: string, value: string, assetId = DAI) => {
      let positionValue;

      if (assetId === WETH && baseOrIlkId !== WETH) {
        // calculate DAIWETH price
        const daiWethPrice = priceMap?.get(WETH)?.get(DAI);
        const daiWethPrice_ = ethers.utils.formatEther(daiWethPrice);
        // calculate WETHDAI price for 'ETH' currency setting
        const wethDaiPrice = 1 / Number(daiWethPrice_);
        positionValue = Number(wethDaiPrice) * Number(value);
      } else {
        const assetPrice = baseOrIlkId !== assetId && priceMap?.get(baseOrIlkId)?.get(assetId);
        const assetPrice_ = assetPrice ? ethers.utils.formatEther(assetPrice) : '1';
        positionValue = Number(assetPrice_) * Number(value);
      }
      return positionValue;
    },
    [priceMap]
  );

  /* get vault position total debt and collateral */
  useEffect(() => {
    const _debts = vaultPositions?.map((vault: IVault) =>
      getPositionValue(vault.baseId, vault.art_, currencySettingAssetId)
    );
    setTotalDebt(
      cleanValue(_debts.reduce((sum: number, debt: number) => sum + debt, 0).toString(), currencySettingDigits)
    );
    const _collaterals = vaultPositions?.map((vault: IVault) =>
      getPositionValue(vault.ilkId, vault.ink_, currencySettingAssetId)
    );
    setTotalCollateral(
      cleanValue(
        _collaterals.reduce((sum: number, collateral: number) => sum + collateral, 0).toString(),
        currencySettingDigits
      )
    );
  }, [priceMap, vaultPositions, currencySettingAssetId, getPositionValue, currencySettingDigits]);

  /* get series positions' total balances */
  useEffect(() => {
    const _lendBalances = lendPositions?.map((series: ISeries) =>
      getPositionValue(series.baseId, series.fyTokenBalance_!, currencySettingAssetId)
    );
    setTotalLendBalance(
      cleanValue(_lendBalances.reduce((sum: number, debt: number) => sum + debt, 0).toString(), currencySettingDigits)
    );

    const _poolBalances = poolPositions?.map((series: ISeries) =>
      getPositionValue(series.baseId, series.poolTokens_!, currencySettingAssetId)
    );
    setTotalPoolBalance(
      cleanValue(_poolBalances.reduce((sum: number, debt: number) => sum + debt, 0).toString(), currencySettingDigits)
    );
  }, [priceMap, lendPositions, poolPositions, currencySettingAssetId, getPositionValue, currencySettingDigits]);

  return (
    <MainViewWrap>
      {!mobile && (
        <PanelWrap justify="between" basis="40%">
          <Box margin={{ top: '35%' }} gap="medium" fill>
            <DashboardBalanceSummary
              debt={totalDebt!}
              collateral={totalCollateral!}
              positionBalance={(Number(totalLendBalance!) + Number(totalPoolBalance!)).toString()}
              digits={currencySettingDigits}
              loading={vaultsLoading || seriesLoading || pricesLoading}
              symbol={currencySettingSymbol}
            />
            <Box>
              {!vaultsLoading && !seriesLoading && !pricesLoading && (
                <DropButton
                  open={settingsOpen}
                  onOpen={() => setSettingsOpen(true)}
                  onClose={() => setSettingsOpen(false)}
                  dropContent={
                    <Box pad="small">
                      <HideBalancesSetting width="30%" />
                      <Box gap="small">
                        <CurrencyToggle width="50%" />
                        <Box direction="row" justify="between">
                          <Text size="small">Show Empty Vaults</Text>
                          <CheckBox
                            toggle
                            checked={showEmpty}
                            onChange={(event) => setShowEmpty(event.target.checked)}
                          />
                        </Box>
                      </Box>
                    </Box>
                  }
                  dropProps={{ align: { top: 'bottom', left: 'left' } }}
                  hoverIndicator={{}}
                  style={{ borderRadius: '6px' }}
                >
                  <Box
                    direction="row"
                    gap="xsmall"
                    pad="xsmall"
                    border={{ color: 'tailwind-blue-100' }}
                    round="xsmall"
                    background="tailwind-blue-50"
                    align="center"
                    justify="between"
                    width="8rem"
                  >
                    <FiTool size="1rem" />
                    <Text size="small">Customize</Text>
                    <FiChevronDown size=".75rem" />
                  </Box>
                </DropButton>
              )}
            </Box>
          </Box>
          <YieldInfo />
        </PanelWrap>
      )}
      <Box fill pad="large" margin={{ top: 'xlarge' }} align="center">
        {!account && !chainLoading && <Text>Please connect to your account</Text>}
        {account && (
          <Box width={mobile ? undefined : '500px'} gap="medium">
            <Box gap="medium">
              <Text size="medium">Vaults</Text>
              {vaultsLoading ? (
                <Skeleton width={mobile ? 300 : 500} count={1} height={40} />
              ) : (
                <DashboardPositionList
                  actionType={ActionType.BORROW}
                  positions={vaultPositions}
                  debt={`${currencySettingSymbol}${totalDebt}`}
                  collateral={`${currencySettingSymbol}${totalCollateral}`}
                />
              )}
            </Box>
            <Box gap="medium">
              <Text size="medium">Lend Positions</Text>
              {seriesLoading ? (
                <Skeleton width={mobile ? 300 : 500} count={1} height={40} />
              ) : (
                <DashboardPositionList
                  actionType={ActionType.LEND}
                  positions={lendPositions}
                  lendBalance={`${currencySettingSymbol}${totalLendBalance}`}
                />
              )}
            </Box>
            <Box gap="medium">
              <Text size="medium">Pool Positions</Text>
              {seriesLoading ? (
                <Skeleton width={mobile ? 300 : 500} count={1} height={40} />
              ) : (
                <DashboardPositionList
                  actionType={ActionType.POOL}
                  positions={poolPositions}
                  poolBalance={`${currencySettingSymbol}${totalPoolBalance}`}
                />
              )}
            </Box>
          </Box>
        )}
      </Box>
      <PanelWrap basis="40%"> </PanelWrap>
    </MainViewWrap>
  );
};
export default Dashboard;

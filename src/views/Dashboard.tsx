import React, { useContext, useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { Box, ResponsiveContext, Text } from 'grommet';
import { ethers } from 'ethers';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ActionType, IUserContext, IVault, ISeries, IStrategy } from '../types';
import YieldInfo from '../components/YieldInfo';
import DashboardBalanceSummary from '../components/DashboardBalanceSummary';
import MainViewWrap from '../components/wraps/MainViewWrap';
import PanelWrap from '../components/wraps/PanelWrap';
import { ZERO_BN, DAI, WETH } from '../utils/constants';
import { cleanValue } from '../utils/appUtils';
import DashboardPositionList from '../components/DashboardPositionList';
import CurrencyToggle from '../components/CurrencyToggle';

const StyledBox = styled(Box)`
  * {
    min-height: auto;
    max-height: fit-content;
  }
  height: auto;
  overflow-y: auto;
`;

interface IPositions {
  vaultPositions: IVault[];
  lendPositions: ISeries[];
  poolPositions: IStrategy[];
}

const Dashboard = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const {
    chainState: { account, chainLoading },
  } = useContext(ChainContext);
  const {
    userState: {
      strategyMap,
      seriesMap,
      vaultMap,
      priceMap,
      vaultsLoading,
      seriesLoading,
      pricesLoading,
      strategiesLoading,
      dashSettings,
    },
    userActions: { setDashSettings },
  } = useContext(UserContext) as IUserContext;
  const {
    hideEmptyVaults,
    hideInactiveVaults,
    hideVaultPositions,
    hideLendPositions,
    hidePoolPositions,
    hideZeroLendBalances,
    hideZeroPoolBalances,
    currencySetting,
  } = dashSettings;

  const [vaultPositions, setVaultPositions] = useState<IVault[]>([]);
  const [lendPositions, setLendPositions] = useState<ISeries[]>([]);
  const [strategyPositions, setStrategyPositions] = useState<IStrategy[]>([]);
  const [allPositions, setAllPositions] = useState<IPositions>({
    vaultPositions: [],
    lendPositions: [],
    poolPositions: [],
  });

  const [totalDebt, setTotalDebt] = useState<string>('');
  const [totalCollateral, setTotalCollateral] = useState<string>('');
  const [totalLendBalance, setTotalLendBalance] = useState<string>('');
  const [totalStrategyBalance, setTotalStrategyBalance] = useState<string>('');

  // currency settings
  const currencySettingAssetId = currencySetting === 'ETH' ? WETH : DAI;
  const currencySettingDigits = currencySetting === 'ETH' ? 4 : 2;
  const currencySettingSymbol = currencySetting === 'ETH' ? 'Ξ' : '$';

  useEffect(() => {
    const _vaultPositions: IVault[] = Array.from(vaultMap.values())
      .filter((vault: IVault) => (hideInactiveVaults ? vault.isActive : true))
      .filter((vault: IVault) => (hideEmptyVaults ? vault.ink.gt(ZERO_BN) || vault.art.gt(ZERO_BN) : true))
      .sort((vaultA: IVault, vaultB: IVault) => (vaultA.art.lt(vaultB.art) ? 1 : -1));
    setVaultPositions(_vaultPositions);
  }, [vaultMap, hideEmptyVaults, hideInactiveVaults]);

  useEffect(() => {
    const _lendPositions: ISeries[] = Array.from(seriesMap.values())
      .filter((_series: ISeries) => (hideZeroLendBalances ? _series.fyTokenBalance?.gt(ZERO_BN) : true))
      .sort((_seriesA: ISeries, _seriesB: ISeries) => (_seriesA.fyTokenBalance?.lt(_seriesB.fyTokenBalance!) ? 1 : -1));
    setLendPositions(_lendPositions);
  }, [seriesMap, hideZeroLendBalances, hideLendPositions]);

  useEffect(() => {
    const _strategyPositions: IStrategy[] = Array.from(strategyMap.values())
      .filter((_strategy: IStrategy) => (hideZeroPoolBalances ? _strategy.accountBalance?.gt(ZERO_BN) : true))
      .sort((_strategyA: IStrategy, _strategyB: IStrategy) =>
        _strategyA.accountBalance?.gt(_strategyB.accountBalance!) ? 1 : -1
      );
    setStrategyPositions(_strategyPositions);
  }, [strategyMap, hideZeroPoolBalances, hidePoolPositions]);

  useEffect(() => {
    setAllPositions({
      vaultPositions: [...vaultPositions],
      lendPositions: [...lendPositions],
      poolPositions: [...strategyPositions],
    });
  }, [vaultPositions, lendPositions, strategyPositions]);

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

  /* get vault, lend, and pool position total debt, collateral, and balances */
  useEffect(() => {
    const {
      vaultPositions: _vaultPositions,
      lendPositions: _lendPositions,
      poolPositions: _strategyPositions,
    } = allPositions;

    const _debts = _vaultPositions?.map((position: any) =>
      getPositionValue(position.baseId, position.art_, currencySettingAssetId)
    );
    setTotalDebt(
      cleanValue(_debts.reduce((sum: number, debt: number) => sum + debt, 0).toString(), currencySettingDigits)
    );

    const _collaterals = _vaultPositions?.map((vault: IVault) =>
      getPositionValue(vault.ilkId, vault.ink_, currencySettingAssetId)
    );
    setTotalCollateral(
      cleanValue(
        _collaterals.reduce((sum: number, collateral: number) => sum + collateral, 0).toString(),
        currencySettingDigits
      )
    );

    const _lendBalances = _lendPositions?.map((series: ISeries) =>
      getPositionValue(series.baseId, series.fyTokenBalance_!, currencySettingAssetId)
    );
    setTotalLendBalance(
      cleanValue(_lendBalances.reduce((sum: number, debt: number) => sum + debt, 0).toString(), currencySettingDigits)
    );

    const _strategyBalances = _strategyPositions?.map((strategy: IStrategy) =>
      getPositionValue(strategy.baseId, strategy.accountBalance_!, currencySettingAssetId)
    );

    setTotalStrategyBalance(
      cleanValue(
        _strategyBalances.reduce((sum: number, debt: number) => sum + debt, 0).toString(),
        currencySettingDigits
      )
    );
  }, [priceMap, allPositions, currencySettingAssetId, getPositionValue, currencySettingDigits]);

  return (
    <MainViewWrap>
      {!mobile && (
        <PanelWrap justify="between" basis="40%">
          <Box margin={{ top: '35%' }} gap="medium" fill>
            <Box width="5rem" height="2rem">
              <CurrencyToggle />
            </Box>
            <DashboardBalanceSummary
              debt={totalDebt!}
              collateral={totalCollateral!}
              positionBalance={(Number(totalLendBalance!) + Number(totalStrategyBalance!)).toString()}
              digits={currencySettingDigits}
              loading={vaultsLoading || seriesLoading || pricesLoading || strategiesLoading}
              symbol={currencySettingSymbol}
            />
          </Box>
          <YieldInfo />
        </PanelWrap>
      )}
      <StyledBox fill pad="large" margin={{ top: 'xlarge' }} align="center">
        {!account && !chainLoading && <Text>Please connect to your account</Text>}
        {account && (
          <Box width={mobile ? undefined : '500px'} gap="medium">
            <Box gap="medium">
              <Box justify="between" direction="row" align="center">
                <Text size="medium">Vaults</Text>
                <Box onClick={() => setDashSettings('hideVaultPositions', !hideVaultPositions)} pad="xsmall">
                  {hideVaultPositions ? <FiEye /> : <FiEyeOff />}
                </Box>
              </Box>
              {!hideVaultPositions && (
                <>
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
                </>
              )}
            </Box>
            <Box gap="medium">
              <Box justify="between" direction="row" align="center">
                <Text size="medium">Lend Positions</Text>
                <Box onClick={() => setDashSettings('hideLendPositions', !hideLendPositions)} pad="xsmall">
                  {hideLendPositions ? <FiEye /> : <FiEyeOff />}
                </Box>
              </Box>
              {!hideLendPositions && (
                <>
                  {seriesLoading ? (
                    <Skeleton width={mobile ? 300 : 500} count={1} height={40} />
                  ) : (
                    <DashboardPositionList
                      actionType={ActionType.LEND}
                      positions={lendPositions}
                      lendBalance={`${currencySettingSymbol}${totalLendBalance}`}
                    />
                  )}
                </>
              )}
            </Box>
            <Box gap="medium">
              <Box justify="between" direction="row" align="center">
                <Text size="medium">Pool Positions</Text>
                <Box onClick={() => setDashSettings('hidePoolPositions', !hidePoolPositions)} pad="xsmall">
                  {hidePoolPositions ? <FiEye /> : <FiEyeOff />}
                </Box>
              </Box>
              {!hidePoolPositions && (
                <>
                  {strategiesLoading ? (
                    <Skeleton width={mobile ? 300 : 500} count={1} height={40} />
                  ) : (
                    <DashboardPositionList
                      actionType={ActionType.POOL}
                      positions={strategyPositions}
                      strategyBalance={`${currencySettingSymbol}${totalStrategyBalance}`}
                    />
                  )}
                </>
              )}
            </Box>
          </Box>
        )}
      </StyledBox>
      <PanelWrap basis="40%"> </PanelWrap>
    </MainViewWrap>
  );
};
export default Dashboard;

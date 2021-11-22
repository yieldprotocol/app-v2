import React, { useContext, useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { Box, ResponsiveContext, Text } from 'grommet';
import Skeleton from '../components/wraps/SkeletonWrap';
import { ChainContext } from '../contexts/ChainContext';
import { ActionType, ISettingsContext, IUserContextState } from '../types';
import YieldInfo from '../components/YieldInfo';
import DashboardBalanceSummary from '../components/DashboardBalanceSummary';
import MainViewWrap from '../components/wraps/MainViewWrap';
import PanelWrap from '../components/wraps/PanelWrap';
import DashboardPositionList from '../components/DashboardPositionList';
import CurrencyToggle from '../components/CurrencyToggle';
import YieldNavigation from '../components/YieldNavigation';
import { SettingsContext } from '../contexts/SettingsContext';
import { useDashboardHelpers }  from '../hooks/viewHelperHooks/useDashboardHelpers';
import { UserContext } from '../contexts/UserContext';
import { formatValue } from '../utils/appUtils';

const StyledBox = styled(Box)`
  * {
    min-height: auto;
    max-height: fit-content;
  }
  height: auto;
  overflow-y: auto;
`;

const Dashboard = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const {
    settingsState: { dashHideVaults, dashHideLendPositions, dashHidePoolPositions },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext) as ISettingsContext;

  const {
    userState: { vaultsLoading, seriesLoading, strategiesLoading, pricesLoading },
  }: { userState: IUserContextState } = useContext(UserContext);

  const {
    chainState: {
      connection: { account },
      chainLoading,
    },
  } = useContext(ChainContext);

  const {
    vaultPositions,
    lendPositions,
    strategyPositions,
    totalDebt,
    totalCollateral,
    totalLendBalance,
    totalStrategyBalance,
    currencySettingDigits,
    currencySettingSymbol,
  } = useDashboardHelpers();

  return (
    <MainViewWrap>
      {!mobile && (
        <PanelWrap justify="between" basis="40%">
          <YieldNavigation sideNavigation={true} />
          <YieldInfo />
        </PanelWrap>
      )}
      <StyledBox fill pad={mobile ? 'medium' : 'large'} margin={{ top: 'xlarge' }} align="center">
        {!account && !chainLoading && <Text>Please connect to your account</Text>}
        {account && (
          <Box width={mobile ? '100%' : '500px'} gap="medium">
            <Box gap="medium">
              <Box justify="between" direction="row" align="center">
                <Text size="medium">Vaults</Text>
                <Box onClick={() => updateSetting('dashHideVaults', !dashHideVaults)} pad="xsmall">
                  {dashHideVaults ? (
                    <Text size="xsmall" color="text-weak">
                      show
                    </Text>
                  ) : (
                    <Text size="xsmall" color="text-weak">
                      hide
                    </Text>
                  )}
                </Box>
              </Box>
              {!dashHideVaults && (
                <>
                  {vaultsLoading ? (
                    <Skeleton width={mobile ? 300 : 500} count={1} height={40} />
                  ) : (
                    <DashboardPositionList
                      actionType={ActionType.BORROW}
                      positions={vaultPositions}
                      debt={`${currencySettingSymbol}${formatValue(totalDebt, currencySettingDigits)}`}
                      collateral={`${currencySettingSymbol}${formatValue(totalCollateral, currencySettingDigits)}`}
                    />
                  )}
                </>
              )}
            </Box>
            <Box gap="medium">
              <Box justify="between" direction="row" align="center">
                <Text size="medium">Lend Positions</Text>
                <Box onClick={() => updateSetting('dashHideLendPositions', !dashHideLendPositions)} pad="xsmall">
                  {dashHideLendPositions ? (
                    <Text size="xsmall" color="text-weak">
                      show
                    </Text>
                  ) : (
                    <Text size="xsmall" color="text-weak">
                      hide
                    </Text>
                  )}
                </Box>
              </Box>
              {!dashHideLendPositions && (
                <>
                  {seriesLoading ? (
                    <Skeleton width={mobile ? 300 : 500} count={1} height={40} />
                  ) : (
                    <DashboardPositionList
                      actionType={ActionType.LEND}
                      positions={lendPositions}
                      lendBalance={`${currencySettingSymbol}${formatValue(totalLendBalance, currencySettingDigits)}`}
                    />
                  )}
                </>
              )}
            </Box>
            <Box gap="medium">
              <Box justify="between" direction="row" align="center">
                <Text size="medium">Pool Positions</Text>
                <Box onClick={() => updateSetting('dashHidePoolPositions', !dashHidePoolPositions)} pad="xsmall">
                  {dashHidePoolPositions ? (
                    <Text size="xsmall" color="text-weak">
                      show
                    </Text>
                  ) : (
                    <Text size="xsmall" color="text-weak">
                      hide
                    </Text>
                  )}
                </Box>
              </Box>
              {!dashHidePoolPositions && (
                <>
                  {strategiesLoading ? (
                    <Skeleton width={mobile ? 300 : 500} count={1} height={40} />
                  ) : (
                    <DashboardPositionList
                      actionType={ActionType.POOL}
                      positions={strategyPositions}
                      strategyBalance={`${currencySettingSymbol}${formatValue(
                        totalStrategyBalance,
                        currencySettingDigits
                      )}`}
                    />
                  )}
                </>
              )}
            </Box>
          </Box>
        )}
      </StyledBox>
      {!mobile && (
        <PanelWrap basis="40%">
          <Box />

          <Box
            margin={{ bottom: '10%' }}
            fill="horizontal"
            background="gradient-transparent"
            round="xsmall"
            pad="xsmall"
          >
            {account && (
              <Box gap="small">
                <Box width="5rem" height="2rem">
                  <CurrencyToggle />
                </Box>
                <DashboardBalanceSummary
                  debt={totalDebt!}
                  collateral={totalCollateral!}
                  lendBalance={totalLendBalance}
                  poolBalance={totalStrategyBalance}
                  digits={currencySettingDigits}
                  symbol={currencySettingSymbol}
                />
              </Box>
            )}
          </Box>
        </PanelWrap>
      )}
    </MainViewWrap>
  );
};
export default Dashboard;

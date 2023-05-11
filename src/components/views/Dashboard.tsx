import { useContext } from 'react';
import styled from 'styled-components';
import { Box, ResponsiveContext, Text } from 'grommet';
import Skeleton from '../wraps/SkeletonWrap';
import { ChainContext } from '../../contexts/ChainContext';
import { ActionType } from '../../types';
import YieldInfo from '../FooterInfo';
import DashboardBalanceSummary from '../DashboardBalanceSummary';
import MainViewWrap from '../wraps/MainViewWrap';
import PanelWrap from '../wraps/PanelWrap';
import DashboardPositionList from '../DashboardPositionList';
import CurrencyToggle from '../CurrencyToggle';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useDashboardHelpers } from '../../hooks/viewHelperHooks/useDashboardHelpers';
import { UserContext } from '../../contexts/UserContext';
import { formatValue } from '../../utils/appUtils';
import { Settings } from '../../contexts/types/settings';
import useAccountPlus from '../../hooks/useAccountPlus';
import useVYTokens from '../../hooks/entities/useVYTokens';

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
  } = useContext(SettingsContext);

  const {
    userState: { vaultsLoading, seriesLoading, strategiesLoading },
  } = useContext(UserContext);

  const {
    chainState: { chainLoaded },
  } = useContext(ChainContext);

  const { address: account } = useAccountPlus();

  const { isLoading: VyTokensLoading } = useVYTokens();

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
      <StyledBox
        pad={mobile ? 'medium' : { left: 'large', top: 'large' }}
        margin={{ top: 'xlarge' }}
        basis={mobile ? undefined : '60%'}
      >
        {!account && chainLoaded && (
          <Box width={mobile ? '100%' : undefined} align="center" fill="horizontal">
            <Text size="small">No Wallet Connected.</Text>
          </Box>
        )}

        {account && (
          <Box width={mobile ? '100%' : undefined} gap="large">
            <Box gap="medium">
              <Box justify="between" direction="row" align="center">
                <Text size="medium">Vaults</Text>
                <Box onClick={() => updateSetting(Settings.DASH_HIDE_VAULTS, !dashHideVaults)} pad="xsmall">
                  {dashHideVaults ? (
                    <Text size="xsmall" color="text-weak">
                      show vaults
                    </Text>
                  ) : (
                    <Text size="xsmall" color="text-weak">
                      hide vaults
                    </Text>
                  )}
                </Box>
              </Box>

              {vaultsLoading ? (
                <Skeleton width={mobile ? 300 : undefined} count={1} height={40} />
              ) : (
                <DashboardPositionList
                  actionType={ActionType.BORROW}
                  positions={vaultPositions}
                  debt={`${currencySettingSymbol}${formatValue(totalDebt!, currencySettingDigits)}`}
                  collateral={`${currencySettingSymbol}${formatValue(totalCollateral!, currencySettingDigits)}`}
                  showList={!dashHideVaults}
                />
              )}
            </Box>
            <Box gap="medium">
              <Box justify="between" direction="row" align="center">
                <Text size="medium">Lend Positions</Text>
                <Box
                  onClick={() => updateSetting(Settings.DASH_HIDE_LEND_POSITIONS, !dashHideLendPositions)}
                  pad="xsmall"
                >
                  {dashHideLendPositions ? (
                    <Text size="xsmall" color="text-weak">
                      show positions
                    </Text>
                  ) : (
                    <Text size="xsmall" color="text-weak">
                      hide positions
                    </Text>
                  )}
                </Box>
              </Box>

              {seriesLoading || VyTokensLoading ? (
                <Skeleton width={mobile ? 300 : undefined} count={1} height={40} />
              ) : (
                <DashboardPositionList
                  actionType={ActionType.LEND}
                  positions={lendPositions}
                  lendBalance={`${currencySettingSymbol}${formatValue(totalLendBalance!, currencySettingDigits)}`}
                  showList={!dashHideLendPositions}
                />
              )}
            </Box>

            <Box gap="medium">
              <Box justify="between" direction="row" align="center">
                <Text size="medium">Liquidity </Text>
                <Box
                  onClick={() => updateSetting(Settings.DASH_HIDE_POOL_POSITIONS, !dashHidePoolPositions)}
                  pad="xsmall"
                >
                  {dashHidePoolPositions ? (
                    <Text size="xsmall" color="text-weak">
                      show positions
                    </Text>
                  ) : (
                    <Text size="xsmall" color="text-weak">
                      hide positions
                    </Text>
                  )}
                </Box>
              </Box>

              {strategiesLoading ? (
                <Skeleton width={mobile ? 300 : undefined} count={1} height={40} />
              ) : (
                <DashboardPositionList
                  actionType={ActionType.POOL}
                  positions={strategyPositions}
                  strategyBalance={`${currencySettingSymbol}${formatValue(
                    totalStrategyBalance!,
                    currencySettingDigits
                  )}`}
                  showList={!dashHidePoolPositions}
                />
              )}
            </Box>
          </Box>
        )}
      </StyledBox>

      {!mobile && (
        <PanelWrap right>
          {account && (
            <Box margin={{ top: 'xlarge' }} fill="horizontal" gap="medium">
              <Box direction="row" justify="between">
                <Text size="medium">Position Overview</Text>
                <Box width="5rem" height="2rem">
                  <CurrencyToggle />
                </Box>
              </Box>

              <Box
                gap="small"
                fill="horizontal"
                background="gradient-transparent"
                round="xsmall"
                pad="medium"
                elevation="medium"
              >
                <DashboardBalanceSummary
                  debt={totalDebt!}
                  collateral={totalCollateral!}
                  lendBalance={totalLendBalance!}
                  poolBalance={totalStrategyBalance!}
                  digits={currencySettingDigits}
                  symbol={currencySettingSymbol}
                />
              </Box>
            </Box>
          )}

          <YieldInfo />
        </PanelWrap>
      )}
    </MainViewWrap>
  );
};
export default Dashboard;

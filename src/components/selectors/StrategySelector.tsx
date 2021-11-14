import React, { useContext, useEffect, createRef, useState } from 'react';
import { ethers } from 'ethers';
import { formatDistanceStrict } from 'date-fns';
import { Avatar, Box, Grid, ResponsiveContext, Text, Tip } from 'grommet';
import { toast } from 'react-toastify';
import { FiInfo, FiSlash } from 'react-icons/fi';

import styled from 'styled-components';
import { ISeries, IStrategy } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { getPoolPercent } from '../../utils/yieldMath';
import { cleanValue, formatStrategyName } from '../../utils/appUtils';
import Skeleton from '../wraps/SkeletonWrap';
import { SettingsContext } from '../../contexts/SettingsContext';
import { usePoolReturns } from '../../hooks/usePoolReturns';

const StyledBox = styled(Box)`
-webkit-transition: transform 0.3s ease-in-out;
-moz-transition: transform 0.3s ease-in-out;
transition: transform 0.3s ease-in-out;
background 0.3s ease-in-out;
:hover {
  transform: scale(1.05);
}
:active {
  transform: scale(1);
}
`;

const ShadeBox = styled(Box)`
  /* -webkit-box-shadow: inset 0px ${(props) => (props ? '-50px' : '50px')} 30px -30px rgba(0,0,0,0.30); 
  box-shadow: inset 0px ${(props) => (props ? '-50px' : '50px')} 30px -30px rgba(0,0,0,0.30); */
`;

const InsetBox = styled(Box)`
  border-radius: 8px;
  box-shadow: inset 1px 1px 1px #ddd, inset -0.25px -0.25px 0.25px #ddd;
`;

const CardSkeleton = () => (
  <StyledBox
    // border={series.id === selectedSeriesId}
    pad="xsmall"
    round="xsmall"
    elevation="xsmall"
    align="center"
  >
    <Box pad="small" width="small" direction="row" align="center" gap="small">
      <Skeleton circle width={45} height={45} />
      <Box>
        <Skeleton count={2} width={100} />
      </Box>
    </Box>
  </StyledBox>
);

interface IStrategySelectorProps {
  inputValue?: string | undefined /* accepts an inpout value for possible dynamic Return  calculations */;
  cardLayout?: boolean;
  setOpen?: any /* used with modal */;
}

function StrategySelector({ inputValue, cardLayout, setOpen }: IStrategySelectorProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const { userState, userActions } = useContext(UserContext);
  const { selectedStrategyAddr, selectedBaseId, strategiesLoading, strategyMap, seriesMap, selectedSeriesId } =
    userState;
  const selectedSeries: ISeries = seriesMap.get(selectedSeriesId);
  const { poolReturns, secondsCompare } = usePoolReturns(selectedSeries, 45000); // previous 45k blocks is around 7 days
  const secondsToDays = formatDistanceStrict(new Date(1, 1, 0, 0, 0, 0), new Date(1, 1, 0, 0, 0, secondsCompare || 0), {
    unit: 'day',
  }); // for visualizing how many days were used in the pool returns calculation

  const [options, setOptions] = useState<IStrategy[]>([]);

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts = Array.from(strategyMap.values()) as IStrategy[];
    const filteredOpts = opts
      .filter((_st: IStrategy) => _st.baseId === selectedBaseId && !_st.currentSeries?.seriesIsMature)
      .sort((a: IStrategy, b: IStrategy) => a.currentSeries?.maturity! - b.currentSeries?.maturity!);

    // .filter((_st: IStrategy) => _st.currentSeries);
    setOptions(filteredOpts);
  }, [selectedBaseId, strategyMap]);

  const handleSelect = (_strategy: IStrategy) => {
    if (_strategy.active) {
      diagnostics && console.log('Strategy selected: ', _strategy.address);
      userActions.setSelectedStrategy(_strategy.address);
      userActions.setSelectedSeries(_strategy.currentSeries?.id);
    } else {
      toast.info('Strategy coming soon');
    }

    mobile && setOpen(false);
  };

  return (
    <>
      {strategiesLoading && <Skeleton width={180} />}

      {cardLayout && (
        <ShadeBox
          overflow={mobile ? 'auto' : 'auto'}
          height={mobile ? undefined : '250px'}
          pad={{ vertical: 'small', horizontal: 'xsmall' }}
        >
          <Grid columns={mobile ? '100%' : '40%'} gap="small">
            {strategiesLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              options.map((strategy: IStrategy) => (
                <StyledBox
                  key={strategy.address}
                  pad="xsmall"
                  round="xsmall"
                  onClick={() => handleSelect(strategy)}
                  background={
                    strategy.address === selectedStrategyAddr ? strategy.currentSeries?.color : 'hoverBackground'
                  }
                  elevation="xsmall"
                  align="center"
                >
                  <Box pad="small" width="small" direction="row" align="center" gap="small">
                    <Avatar
                      background={
                        strategy.address === selectedStrategyAddr
                          ? 'lightBackground'
                          : strategy.currentSeries?.endColor.toString().concat('10')
                      }
                      style={{
                        boxShadow:
                          strategy.address === selectedStrategyAddr
                            ? `inset 1px 1px 2px ${strategy.currentSeries?.endColor.toString().concat('69')}`
                            : undefined,
                      }}
                    >
                      {strategy.currentSeries?.seriesMark || <FiSlash />}
                    </Avatar>
                    <Box>
                      {(!selectedStrategyAddr || !inputValue) && (
                        <>
                          <Text
                            size="small"
                            color={
                              strategy.address === selectedStrategyAddr ? strategy.currentSeries?.textColor : undefined
                            }
                          >
                            {formatStrategyName(strategy.name)}
                          </Text>
                          <Text
                            size="xsmall"
                            color={
                              strategy.address === selectedStrategyAddr ? strategy.currentSeries?.textColor : undefined
                            }
                          >
                            Rolling {seriesMap.get(strategy.currentSeriesId)?.displayName}
                          </Text>
                        </>
                      )}

                      {selectedStrategyAddr && inputValue && (
                        <>
                          <Text
                            size="small"
                            color={
                              strategy.address === selectedStrategyAddr ? strategy.currentSeries?.textColor : undefined
                            }
                          >
                            {cleanValue(
                              getPoolPercent(
                                ethers.utils.parseUnits(cleanValue(inputValue, strategy.decimals), strategy.decimals),
                                strategy.strategyTotalSupply!
                              ),
                              3
                            )}
                            %
                          </Text>
                          <Text
                            size="xsmall"
                            color={
                              strategy.address === selectedStrategyAddr ? strategy.currentSeries?.textColor : undefined
                            }
                          >
                            of strategy
                          </Text>
                          {strategy.address === selectedStrategyAddr && poolReturns && (
                            <Box direction="row">
                              <Text size="small" color={strategy.currentSeries?.textColor}>
                                {cleanValue(poolReturns, 2)}% APY
                              </Text>
                              <Tip
                                content={<Text size="xsmall">using last {secondsToDays} days estimated returns</Text>}
                                dropProps={{
                                  align: { left: 'right' },
                                }}
                              >
                                <FiInfo size=".6em" />
                              </Tip>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  </Box>
                </StyledBox>
              ))
            )}
          </Grid>
        </ShadeBox>
      )}
    </>
  );
}

StrategySelector.defaultProps = {
  inputValue: undefined,
  cardLayout: true,
  setOpen: () => null,
};

export default StrategySelector;

import { useContext, useEffect, useState } from 'react';
import { Avatar, Box, Layer, ResponsiveContext, Text } from 'grommet';
import { toast } from 'react-toastify';
import { FiSlash, FiX } from 'react-icons/fi';

import styled from 'styled-components';
import { IStrategy, IUserContext, IUserContextActions, IUserContextState } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { formatStrategyName } from '../../utils/appUtils';
import Skeleton from '../wraps/SkeletonWrap';
import { SettingsContext } from '../../contexts/SettingsContext';
import AltText from '../texts/AltText';
import { ZERO_BN } from '../../utils/constants';
import Line from '../elements/Line';
import useStrategyReturns from '../../hooks/useStrategyReturns';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  background: 0.3s ease-in-out;
  :hover {
    transform: scale(1.05);
  }
  :active {
    transform: scale(1);
  }
`;

const CardSkeleton = () => (
  <StyledBox round="large" elevation="xsmall" align="center">
    <Box pad="small" width="small" direction="row" gap="small" fill>
      <Skeleton circle width={45} height={45} />
      <Box>
        <Skeleton width={250} />
        <Skeleton width={150} />
      </Box>
    </Box>
  </StyledBox>
);

interface IStrategySelectorProps {
  inputValue?: string | undefined /* accepts an input value for possible dynamic Return calculations */;
  cardLayout?: boolean;
  setOpen?: any /* used with modal */;
  open?: boolean;
}

function StrategySelector({ inputValue, cardLayout, setOpen, open = false }: IStrategySelectorProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const { returns, calcStrategyReturns } = useStrategyReturns(inputValue);

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;

  const { selectedStrategy, selectedBase, strategiesLoading, strategyMap, seriesMap } = userState;
  const [options, setOptions] = useState<IStrategy[]>([]);

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts = Array.from(strategyMap.values()) as IStrategy[];
    const filteredOpts = opts
      .filter((_st) => _st.currentSeries?.showSeries)
      .filter((_st) => _st.baseId === selectedBase?.proxyId && !_st.currentSeries?.seriesIsMature)
      .filter((_st) => _st.id !== selectedStrategy?.id)
      .sort((a, b) => a.currentSeries?.maturity! - b.currentSeries?.maturity!);
    setOptions(filteredOpts);
  }, [selectedBase, strategyMap, selectedStrategy]);

  const handleSelect = (_strategy: IStrategy) => {
    if (_strategy.active) {
      diagnostics && console.log('Strategy selected: ', _strategy.address);
      userActions.setSelectedStrategy(_strategy);
      userActions.setSelectedSeries(_strategy.currentSeries!);
    } else {
      toast.info('Strategy coming soon');
    }
    setOpen(false);
  };

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts: IStrategy[] = Array.from(strategyMap.values())
      .filter((_st) => _st.currentSeries?.showSeries)
      .filter((_st: IStrategy) => _st.baseId === selectedBase?.proxyId && !_st.currentSeries?.seriesIsMature);
    const strategyWithBalance = opts.find((_st) => _st?.accountBalance?.gt(ZERO_BN));
    /* select strategy with existing balance */
    if (strategyWithBalance) {
      userActions.setSelectedStrategy(strategyWithBalance);
    } else {
      /* select strategy with the lowest totalSupply and is active */
      opts.length &&
        userActions.setSelectedStrategy(
          opts
            .filter((s) => s.currentSeries?.showSeries)
            .filter((s) => s.active)
            .reduce((prev, curr) =>
              parseInt(prev.poolTotalSupply_!, 10) < parseInt(curr.poolTotalSupply_!, 10) ? prev : curr
            )
        );
      /* or select random strategy from opts */
      // userActions.setSelectedStrategy(opts[Math.floor(Math.random() * opts.length)]);
    }
  }, [selectedBase, strategyMap]);

  return (
    <>
      {cardLayout && (
        <Box gap="small">
          {strategiesLoading && <Skeleton width={180} />}

          {strategiesLoading ? (
            <CardSkeleton />
          ) : (
            <Box
              key={selectedStrategy?.address}
              round="large"
              background={selectedStrategy?.currentSeries?.color}
              elevation="xsmall"
            >
              <Box pad="small" width="small" direction="row" gap="small" fill>
                <Box direction="row" gap="small" fill>
                  <Avatar
                    background="background"
                    style={{
                      boxShadow: `inset 1px 1px 2px ${selectedStrategy?.currentSeries?.endColor
                        .toString()
                        .concat('69')}`,
                    }}
                  >
                    {selectedStrategy?.currentSeries?.seriesMark || <FiSlash />}
                  </Avatar>
                  <Box align="center" fill="vertical" justify="center">
                    <>
                      <Text size="small" color={selectedStrategy?.currentSeries?.textColor}>
                        {formatStrategyName(selectedStrategy?.name!)}
                      </Text>
                      <Text size="xsmall" color={selectedStrategy?.currentSeries?.textColor}>
                        Rolling {seriesMap.get(selectedStrategy?.currentSeriesId!)?.displayName}
                      </Text>
                    </>
                  </Box>

                  {/* {selectedStrategy && inputValue && returns && (
                    <Box align="center" direction="row" gap="xsmall">
                      <Text size="small" color={selectedStrategy?.currentSeries?.textColor}>
                        {returns.blendedAPY}%
                      </Text>
                      <Text size="small" color={selectedStrategy?.currentSeries?.textColor}>
                        Variable APY
                      </Text>
                    </Box>
                  )} */}
                </Box>

                {open && (
                  <Layer
                    onClickOutside={() => setOpen(false)}
                    style={{ minWidth: mobile ? undefined : '500px', borderRadius: '12px' }}
                  >
                    <Box background="background" round="12px">
                      <Box
                        direction="row"
                        justify="between"
                        align="center"
                        pad="medium"
                        background="gradient-transparent"
                        round={{ corner: 'top', size: 'small' }}
                      >
                        <Text size="small">Select Strategy</Text>
                        <Box onClick={() => setOpen(false)}>
                          <FiX size="1.5rem" />
                        </Box>
                      </Box>

                      <Line />

                      <Box pad="large">
                        {options.map((strategy) => {
                          const returns = calcStrategyReturns(strategy, inputValue || '1');

                          return (
                            <StyledBox
                              key={strategy.id}
                              pad="xsmall"
                              round="large"
                              onClick={() => handleSelect(strategy)}
                              background={strategy.currentSeries?.color}
                              elevation="xsmall"
                              margin="xsmall"
                            >
                              <Box pad="small" width="small" direction="row" gap="small" fill key={strategy.id}>
                                <Avatar
                                  background="background"
                                  style={{
                                    boxShadow: `inset 1px 1px 2px ${strategy.currentSeries?.endColor
                                      .toString()
                                      .concat('69')}`,
                                  }}
                                >
                                  {strategy.currentSeries?.seriesMark || <FiSlash />}
                                </Avatar>
                                <Box>
                                  <Text size="small" color={strategy.currentSeries?.textColor}>
                                    {formatStrategyName(selectedStrategy?.name!)}
                                  </Text>
                                  <Text size="xsmall" color={strategy.currentSeries?.textColor}>
                                    Rolling {seriesMap.get(strategy.currentSeriesId)?.displayName}
                                  </Text>
                                </Box>
                                {returns.blendedAPY && (
                                  <Avatar
                                    background="background"
                                    style={{
                                      boxShadow: `inset 1px 1px 2px ${strategy.currentSeries?.endColor
                                        .toString()
                                        .concat('69')}`,
                                    }}
                                  >
                                    {returns.blendedAPY}%
                                  </Avatar>
                                )}
                              </Box>
                            </StyledBox>
                          );
                        })}
                      </Box>
                    </Box>
                  </Layer>
                )}

                {returns?.blendedAPY && (
                  <Box justify="end" fill align="end">
                    <Avatar
                      background="background"
                      style={{
                        boxShadow: `inset 1px 1px 2px ${selectedStrategy?.currentSeries?.endColor
                          .toString()
                          .concat('69')}`,
                      }}
                    >
                      <Text size="small" color={selectedStrategy?.currentSeries?.textColor}>
                        {returns.blendedAPY}%
                      </Text>
                    </Avatar>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {options.length > 0 && (
            <Box>
              <StyledBox align="end" onClick={() => setOpen(true)} pad={{ right: 'xsmall' }}>
                <AltText size="xsmall" color="text-weak">
                  Select a different strategy
                </AltText>
              </StyledBox>
            </Box>
          )}
        </Box>
      )}
    </>
  );
}

StrategySelector.defaultProps = {
  inputValue: undefined,
  cardLayout: true,
  setOpen: () => null,
  open: false,
};

export default StrategySelector;

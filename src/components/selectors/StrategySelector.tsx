import React, { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Avatar, Box, Grid, Layer, ResponsiveContext, Text } from 'grommet';
import { toast } from 'react-toastify';
import { FiSlash, FiX } from 'react-icons/fi';

import styled from 'styled-components';
import { IStrategy, IUserContext, IUserContextActions, IUserContextState } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { getPoolPercent } from '../../utils/yieldMath';
import { cleanValue, formatStrategyName } from '../../utils/appUtils';
import Skeleton from '../wraps/SkeletonWrap';
import { SettingsContext } from '../../contexts/SettingsContext';
import AltText from '../texts/AltText';
import { ZERO_BN } from '../../utils/constants';

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

const CardSkeleton = () => (
  <StyledBox pad="xsmall" round="xsmall" elevation="xsmall" align="center">
    <Box pad="small" width="small" direction="row" align="center" gap="small">
      <Skeleton circle width={45} height={45} />
      <Box>
        <Skeleton count={2} width={100} />
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
      .filter((_st: IStrategy) => _st.baseId === selectedBase?.idToUse && !_st.currentSeries?.seriesIsMature)
      .sort((a: IStrategy, b: IStrategy) => a.currentSeries?.maturity! - b.currentSeries?.maturity!);
    // .filter((_st: IStrategy) => _st.currentSeries);
    setOptions(filteredOpts);
  }, [selectedBase, strategyMap]);

  const handleSelect = (_strategy: IStrategy) => {
    if (_strategy.active) {
      diagnostics && console.log('Strategy selected: ', _strategy.address);
      userActions.setSelectedStrategy(_strategy);
      userActions.setSelectedSeries(_strategy.currentSeries!);
    } else {
      toast.info('Strategy coming soon');
    }
    mobile && setOpen(false);
  };

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts: IStrategy[] = Array.from(strategyMap.values()).filter(
      (_st: IStrategy) => _st.baseId === selectedBase?.idToUse && !_st.currentSeries?.seriesIsMature
    );

    const strategyWithBalance = opts.find((_st) => _st?.accountBalance?.gt(ZERO_BN));

    console.log(strategyWithBalance);
    /* select strategy with existing balance */
    if (strategyWithBalance) {
      userActions.setSelectedStrategy(strategyWithBalance);
    } else {
      /* or select random strategy from opts */
      userActions.setSelectedStrategy(opts[Math.floor(Math.random() * opts.length)]);
    }
  }, [selectedBase, strategyMap]);

  return (
    <>
      {cardLayout && (
        <ShadeBox
          overflow={mobile ? 'auto' : 'auto'}
          height={mobile ? undefined : '250px'}
          pad={{ vertical: 'small', horizontal: 'xsmall' }}
          gap="small"
        >
          {strategiesLoading ? (
            <CardSkeleton />
          ) : (
            <StyledBox
              key={selectedStrategy?.address}
              pad="xsmall"
              round="xsmall"
              // onClick={() => handleSelect(strategy)}
              // background={
              //   strategy.address === selectedStrategy?.address ? strategy.currentSeries?.color : 'hoverBackground'
              // }
              background={selectedStrategy?.currentSeries?.color}
              elevation="xsmall"
              margin="xsmall"
            >
              <Box pad="small" width="small" direction="row" gap="small" fill>
                <Avatar
                  background="background"
                  style={{
                    boxShadow: `inset 1px 1px 2px ${selectedStrategy?.currentSeries?.endColor.toString().concat('69')}`,
                  }}
                >
                  {selectedStrategy?.currentSeries?.seriesMark || <FiSlash />}
                </Avatar>
                <Box>
                  {(!selectedStrategy || !inputValue) && (
                    <>
                      <Text size="small" color={selectedStrategy?.currentSeries?.textColor}>
                        {/* {formatStrategyName(selectedStrategy?.name!)} */}
                        {selectedStrategy?.name}
                      </Text>
                      <Text size="xsmall" color={selectedStrategy?.currentSeries?.textColor}>
                        Rolling {seriesMap.get(selectedStrategy?.currentSeriesId!)?.displayName}
                      </Text>
                    </>
                  )}

                  {selectedStrategy && inputValue && (
                    <>
                      <Text size="small" color={selectedStrategy?.currentSeries?.textColor}>
                        {cleanValue(
                          getPoolPercent(
                            ethers.utils.parseUnits(
                              cleanValue(inputValue, selectedStrategy?.decimals),
                              selectedStrategy?.decimals
                            ),
                            selectedStrategy?.strategyTotalSupply!
                          ),
                          3
                        )}
                        %
                      </Text>
                      <Text size="xsmall" color={selectedStrategy?.currentSeries?.textColor}>
                        of strategy
                      </Text>
                    </>
                  )}
                </Box>
                {open && (
                  <Layer onClickOutside={() => setOpen(false)}>
                    <Box gap="small" pad="medium" fill background="background">
                      <Box alignSelf="end" onClick={() => setOpen(false)}>
                        <FiX size="1.5rem" />
                      </Box>
                      {options.map((strategy) => (
                        <StyledBox
                          key={strategy.id}
                          pad="xsmall"
                          round="xsmall"
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
                                {strategy.name}
                              </Text>
                              <Text size="xsmall" color={strategy.currentSeries?.textColor}>
                                Rolling {seriesMap.get(strategy.currentSeriesId)?.displayName}
                              </Text>
                            </Box>
                          </Box>
                        </StyledBox>
                      ))}
                    </Box>
                  </Layer>
                )}
              </Box>
            </StyledBox>
          )}
          {strategiesLoading && (
            <Box align="end">
              <Skeleton width={180} />
            </Box>
          )}
        </ShadeBox>
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

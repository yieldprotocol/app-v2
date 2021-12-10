import React, { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Avatar, Box, Grid, ResponsiveContext, Text } from 'grommet';
import { toast } from 'react-toastify';
import { FiSlash } from 'react-icons/fi';

import styled from 'styled-components';
import { IStrategy, IUserContext, IUserContextActions, IUserContextState } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { getPoolPercent } from '../../utils/yieldMath';
import { cleanValue, formatStrategyName } from '../../utils/appUtils';
import Skeleton from '../wraps/SkeletonWrap';
import { SettingsContext } from '../../contexts/SettingsContext';

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
  inputValue?: string | undefined /* accepts an inpout value for possible dynamic Return  calculations */;
  cardLayout?: boolean;
  setOpen?: any /* used with modal */;
}

function StrategySelector({ inputValue, cardLayout, setOpen }: IStrategySelectorProps) {
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

  return (
    <>
      {strategiesLoading && <Skeleton width={180} />}

      {selectedStrategy && (
        <Box pad="small" width="small" direction="row" align="center" gap="small">
          <Avatar
            background={selectedStrategy.currentSeries?.endColor.toString().concat('10')}
            style={{
              boxShadow: `inset 1px 1px 2px ${selectedStrategy.currentSeries?.endColor.toString().concat('69')}`,
            }}
          >
            {selectedStrategy.currentSeries?.seriesMark || <FiSlash />}
          </Avatar>
          <Box>
            {(!selectedStrategy || !inputValue) && (
              <>
                <Text size="small" color={selectedStrategy.currentSeries?.textColor}>
                  {formatStrategyName(selectedStrategy.name)}
                </Text>
                <Text size="xsmall" color={selectedStrategy.currentSeries?.textColor}>
                  Rolling {seriesMap.get(selectedStrategy.currentSeriesId)?.displayName}
                </Text>
              </>
            )}

            {selectedStrategy && inputValue && (
              <>
                <Text size="small" color={selectedStrategy.currentSeries?.textColor}>
                  {cleanValue(
                    getPoolPercent(
                      ethers.utils.parseUnits(
                        cleanValue(inputValue, selectedStrategy.decimals),
                        selectedStrategy.decimals
                      ),
                      selectedStrategy.strategyTotalSupply!
                    ),
                    3
                  )}
                  %
                </Text>
                <Text size="xsmall" color={selectedStrategy.currentSeries?.textColor}>
                  of strategy
                </Text>
              </>
            )}
          </Box>
        </Box>
      )}

      {cardLayout && (
        <ShadeBox
          overflow={mobile ? 'auto' : 'auto'}
          height={mobile ? undefined : '250px'}
          pad={{ vertical: 'small', horizontal: 'xsmall' }}
        >
          {' '}
          {false}
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

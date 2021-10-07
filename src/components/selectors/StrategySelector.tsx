import React, { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Avatar, Box, Grid, ResponsiveContext, Text } from 'grommet';
import { toast } from 'react-toastify';
import { FiSlash } from 'react-icons/fi';

import Skeleton from 'react-loading-skeleton';
import styled from 'styled-components';
import { IStrategy } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { getPoolPercent } from '../../utils/yieldMath';
import { formatStrategyName, getStrategySymbol } from '../../utils/appUtils';

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
}

function StrategySelector({ inputValue, cardLayout }: IStrategySelectorProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const { userState, userActions } = useContext(UserContext);
  const { selectedStrategyAddr, selectedBaseId, strategiesLoading, strategyMap } = userState;

  const [options, setOptions] = useState<IStrategy[]>([]);

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts = Array.from(strategyMap.values()) as IStrategy[];
    const filteredOpts = opts.filter(
      (_st: IStrategy) => _st.baseId === selectedBaseId && !_st.currentSeries?.seriesIsMature
    );
    // .filter((_st: IStrategy) => _st.currentSeries);
    setOptions(filteredOpts);
  }, [selectedBaseId, strategyMap]);

  const handleSelect = (_strategy: IStrategy) => {
    if (_strategy.active) {
      console.log('Strategy selected: ', _strategy.address);
      userActions.setSelectedStrategy(_strategy.address);
      userActions.setSelectedSeries(_strategy.currentSeries?.id);
    } else {
      toast.info('Strategy coming soon');
      console.log('strategy not yet active');
    }
  };

  return (
    <>
      {strategiesLoading && <Skeleton width={180} />}

      {cardLayout && (
        <Box overflow={mobile ? undefined : 'auto'} height={mobile ? undefined : '250px'} pad="xsmall">
          <Grid columns={mobile ? '100%' : '40%'} gap="small">
            {strategiesLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              options.map((strategy: IStrategy) => (
                <StyledBox
                  // border={series.id === selectedSeriesId}
                  key={strategy.address}
                  pad="xsmall"
                  round="xsmall"
                  onClick={() => handleSelect(strategy)}
                  background={strategy.address === selectedStrategyAddr ? strategy.currentSeries?.color : 'solid'}
                  elevation="xsmall"
                  align="center"
                >
                  <Box pad="small" width="small" direction="row" align="center" gap="small">
                    <Avatar background="solid">{strategy.currentSeries?.seriesMark || <FiSlash />}</Avatar>
                    <Box>
                      {(!selectedStrategyAddr || !inputValue) && (
                        <Text
                          size="small"
                          color={
                            strategy.address === selectedStrategyAddr ? strategy.currentSeries?.textColor : undefined
                          }
                        >
                          {formatStrategyName(strategy.name)}
                        </Text>
                      )}

                      {selectedStrategyAddr && inputValue && (
                        <>
                          <Text
                            size="small"
                            color={
                              strategy.address === selectedStrategyAddr ? strategy.currentSeries?.textColor : undefined
                            }
                          >
                            {getPoolPercent(
                              ethers.utils.parseUnits(inputValue, strategy.decimals),
                              strategy.strategyTotalSupply!
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
                        </>
                      )}
                    </Box>
                  </Box>
                </StyledBox>
              ))
            )}
          </Grid>
        </Box>
      )}
    </>
  );
}

StrategySelector.defaultProps = {
  inputValue: undefined,
  cardLayout: true,
};

export default StrategySelector;

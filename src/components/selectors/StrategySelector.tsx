import { useContext, useEffect, useState } from 'react';
import { Avatar, Box, Text } from 'grommet';
import { toast } from 'react-toastify';
import { FiAlertTriangle, FiSlash } from 'react-icons/fi';

import styled from 'styled-components';
import { ActionCodes, IStrategy } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { formatStrategyName } from '../../utils/appUtils';
import Skeleton from '../wraps/SkeletonWrap';
import { SettingsContext } from '../../contexts/SettingsContext';
import { ZERO_BN } from '../../utils/constants';
import useStrategyReturns, { IReturns } from '../../hooks/useStrategyReturns';
import { StrategyType } from '../../config/strategies';

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

const StrategySelectItem = ({
  strategy,
  selected,
  displayName,
  handleClick,
  returns,
}: {
  strategy: IStrategy;
  selected: boolean;
  displayName: string;
  handleClick: (strategy: IStrategy) => void;
  returns?: IReturns;
}) => {
  return (
    <StyledBox
      key={strategy.address}
      round="large"
      background={selected ? strategy.currentSeries?.color : '#00000007'}
      elevation="xsmall"
      onClick={handleClick}
    >
      <Box pad="small" width="small" direction="row" gap="small" fill>
        <Box direction="row" gap="small" fill>
          <Avatar
            background={selected ? 'background' : strategy.currentSeries?.endColor.toString().concat('20')}
            style={{
              boxShadow: `inset 1px 1px 2px ${strategy.currentSeries?.endColor.toString().concat('69')}`,
            }}
          >
            {strategy.currentSeries?.seriesMark || <FiSlash />}
          </Avatar>
          <Box align="center" fill="vertical" justify="center">
            <Box direction="row">
              <Text size="small" color={selected ? strategy.currentSeries?.textColor : 'text-weak'}>
                {formatStrategyName(strategy.name!)}
              </Text>
            </Box>

            <Text size="xsmall" color={selected ? strategy.currentSeries?.textColor : 'text-weak'}>
              Rolling {displayName}
            </Text>
          </Box>
        </Box>

        {strategy.rewardsRate?.gt(ZERO_BN) && (
          <Box
            round
            background="red"
            pad={{ horizontal: 'small', vertical: 'xsmall' }}
            style={{ position: 'absolute', marginTop: '-1em', marginLeft: '17em' }}
            elevation="small"
          >
            <Text size="small" color="white" textAlign="center">
              +{returns?.rewardsAPY}%
            </Text>
          </Box>
        )}

        {returns?.blendedAPY && (
          <Box fill align="end">
            <Avatar
              background={selected ? 'background' : strategy.currentSeries?.endColor.toString().concat('20')}
              style={{
                boxShadow: `inset 1px 1px 2px ${strategy.currentSeries?.endColor.toString().concat('69')}`,
              }}
            >
              {strategy.currentSeries?.allowActions.includes('allow_all') ||
              strategy.currentSeries?.allowActions.includes(ActionCodes.ADD_LIQUIDITY) ? (
                <Text size="small">{(+returns.blendedAPY - +returns.rewardsAPY!).toFixed(1)}%</Text>
              ) : (
                <Text color="red">
                  <FiAlertTriangle />
                </Text>
              )}
            </Avatar>
          </Box>
        )}
      </Box>
    </StyledBox>
  );
};

interface IStrategySelectorProps {
  inputValue?: string /* accepts an input value for possible dynamic Return calculations */;
  setOpen?: any;
}

const StrategySelector = ({ inputValue }: IStrategySelectorProps) => {
  const { calcStrategyReturns } = useStrategyReturns(inputValue);

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const {
    userState,
    userActions: { setSelectedSeries, setSelectedStrategy },
  } = useContext(UserContext);

  const { selectedStrategy, selectedBase, strategiesLoading, strategyMap, seriesMap } = userState;
  const [options, setOptions] = useState<IStrategy[]>([]);

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts = Array.from(strategyMap?.values()!);
    const filteredOpts = opts
      .filter((_st) => _st.type === StrategyType.V2_1)
      .filter((_st) => !_st.currentSeries?.hideSeries || !_st.disabled)
      .filter((_st) => _st.baseId === selectedBase?.proxyId && !_st.currentSeries?.seriesIsMature)
      .sort((a, b) => a.currentSeries?.maturity! - b.currentSeries?.maturity!);

    setOptions(filteredOpts);
  }, [selectedBase, strategyMap, selectedStrategy]);

  const handleSelect = (_strategy: IStrategy) => {
    diagnostics && console.log('SELECTED: ', _strategy.address, 'VERSION: ', _strategy.type);
    if (!_strategy.disabled) {
      diagnostics && console.log('Strategy selected: ', _strategy.address);
      setSelectedStrategy(_strategy);
      setSelectedSeries(_strategy.currentSeries!);
    } else {
      toast.info('Strategy coming soon');
    }
  };

  /* Auto select a default strategy  */
  useEffect(() => {
    /* if strategy already selected, no need to set explicitly again */
    if (selectedStrategy) return;
    const opts: IStrategy[] = Array.from(strategyMap.values())
      .filter((_st) => _st.type === StrategyType.V2_1) // we only want to show V2.1 strategies in the selector for now.
      .filter((_st) => !_st.currentSeries?.hideSeries || !_st.disabled)
      .filter((_st) => _st.baseId === selectedBase?.proxyId && !_st.currentSeries?.seriesIsMature);

    /* select strategy with rewards */
    const strategyWithRewards = opts.find((s) => s.rewardsRate?.gt(ZERO_BN));
    if (strategyWithRewards) {
      setSelectedStrategy(strategyWithRewards);
      return;
    }
    /* select strategy with existing balance */
    const strategyWithBalance = opts.find((_st) => _st?.accountBalance?.gt(ZERO_BN));
    if (strategyWithBalance) {
      setSelectedStrategy(strategyWithBalance);
      return;
    }
    /* else set a random one as a last resort */
    setSelectedStrategy(opts[Math.floor(Math.random() * opts.length)]);
  }, [selectedBase, selectedStrategy, setSelectedStrategy, strategyMap]);

  return (
    <Box>
      {!selectedBase && <Skeleton width={180} />}
      {strategiesLoading && (
        <>
          <CardSkeleton />
          <CardSkeleton />
        </>
      )}

      {!strategiesLoading && (
        <Box gap="small">
          {options.map((o: IStrategy) => {
            const displayName = o.currentSeries?.displayName!;
            const returns = calcStrategyReturns(o, inputValue && +inputValue !== 0 ? inputValue : '1');
            const selected = selectedStrategy?.address === o.address;
            return (
              <StrategySelectItem
                key={o.address}
                strategy={o}
                handleClick={() => handleSelect(o)}
                selected={selected}
                displayName={displayName}
                returns={returns}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
};

StrategySelector.defaultProps = {
  inputValue: undefined,
};

export default StrategySelector;

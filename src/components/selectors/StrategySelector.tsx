import { useCallback, useContext, useEffect, useState } from 'react';
import { Avatar, Box, Text } from 'grommet';
import { FiSlash } from 'react-icons/fi';

import styled from 'styled-components';
import { IStrategy } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { formatStrategyName } from '../../utils/appUtils';
import Skeleton from '../wraps/SkeletonWrap';
import { SettingsContext } from '../../contexts/SettingsContext';
import useStrategyReturns from '../../hooks/useStrategyReturns';
import useStrategy from '../../hooks/useStrategy';
import useStrategies from '../../hooks/useStrategies';

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

export const CardSkeleton = () => (
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
  input,
  address,
  selected,
  displayName,
  handleClick,
}: {
  input: string;
  address: string;
  selected: boolean;
  displayName: string;
  handleClick: (strategy: IStrategy) => void;
  apy?: string;
}) => {
  const { calcStrategyReturns } = useStrategyReturns(input);
  const { data: strategy } = useStrategy(address);
  const returns = calcStrategyReturns(strategy!, input && +input !== 0 ? input : '1');

  if (!strategy) return <CardSkeleton />;

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
            <Text size="small" color={selected ? strategy.currentSeries?.textColor : 'text-weak'}>
              {formatStrategyName(strategy.name!)}
            </Text>
            <Text size="xsmall" color={selected ? strategy.currentSeries?.textColor : 'text-weak'}>
              Rolling {displayName}
            </Text>
          </Box>
        </Box>

        {returns && (
          <Box fill align="end">
            <Avatar
              background={selected ? 'background' : strategy.currentSeries?.endColor.toString().concat('20')}
              style={{
                boxShadow: `inset 1px 1px 2px ${strategy.currentSeries?.endColor.toString().concat('69')}`,
              }}
            >
              <Text size="small">{returns.blendedAPY}%</Text>
            </Avatar>
          </Box>
        )}
      </Box>
    </StyledBox>
  );
};

interface IStrategySelectorProps {
  inputValue?: string /* accepts an input value for possible dynamic Return calculations */;
}

const StrategySelector = ({ inputValue }: IStrategySelectorProps) => {
  const { data: strategyMap } = useStrategies();

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const { userState, userActions } = useContext(UserContext);

  const { selectedStrategy, selectedBase, seriesMap } = userState;
  const [options, setOptions] = useState<IStrategy[]>();

  const filterStrategies = useCallback(
    (strategies: IStrategy[]) => {
      return strategies
        .filter((_st) => _st.currentSeries?.baseId === selectedBase?.proxyId)
        .filter((_st) => !_st.currentSeries?.seriesIsMature)
        .sort((a, b) => a.currentSeries?.maturity! - b.currentSeries?.maturity!);
    },
    [selectedBase?.proxyId]
  );

  useEffect(() => {
    if (!strategyMap) return;
    setOptions(filterStrategies(Array.from(strategyMap.values())));
  }, [filterStrategies, strategyMap]);

  const handleSelect = (_strategy: IStrategy) => {
    diagnostics && console.log('Strategy selected: ', _strategy.address);
    userActions.setSelectedStrategy(_strategy);
    userActions.setSelectedSeries(_strategy.currentSeries!);
  };

  if (!options)
    return (
      <Box gap="small">
        <CardSkeleton />
        <CardSkeleton />
      </Box>
    );

  return (
    <Box gap="small">
      {options.map((o) => {
        const displayName = seriesMap?.get(o.currentSeriesId!)?.displayName!;
        const selected = selectedStrategy?.address === o.address;
        return (
          <StrategySelectItem
            key={o.address}
            input={inputValue!}
            address={o.address}
            handleClick={() => handleSelect(o)}
            selected={selected}
            displayName={displayName}
          />
        );
      })}
    </Box>
  );
};

StrategySelector.defaultProps = {
  inputValue: undefined,
};

export default StrategySelector;

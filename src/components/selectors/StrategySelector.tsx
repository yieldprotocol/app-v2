import { useContext, useEffect, useState } from 'react';
import { Avatar, Box, Text } from 'grommet';
import { toast } from 'react-toastify';
import { FiSlash } from 'react-icons/fi';

import styled from 'styled-components';
import { IStrategy } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { formatStrategyName } from '../../utils/appUtils';
import Skeleton from '../wraps/SkeletonWrap';
import { SettingsContext } from '../../contexts/SettingsContext';
import { ZERO_BN } from '../../utils/constants';
import useStrategyReturns, { IReturns } from '../../hooks/useStrategyReturns';
import useSeriesEntities from '../../hooks/useSeriesEntities';
import YieldMark from '../logos/YieldMark';

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
  input,
}: {
  strategy: IStrategy;
  selected: boolean;
  displayName: string;
  handleClick: (strategy: IStrategy) => void;
  input: string | undefined;
}) => {
  const {
    seriesEntities: { data: seriesEntities },
  } = useSeriesEntities();
  const strategySeries = seriesEntities?.get(strategy.currentSeriesId!);
  const { returns } = useStrategyReturns(input, strategy);

  return (
    <StyledBox
      key={strategy.address}
      round="large"
      background={selected ? strategySeries?.color : '#00000007'}
      elevation="xsmall"
      onClick={handleClick}
    >
      <Box pad="small" width="small" direction="row" gap="small" fill>
        <Box direction="row" gap="small" fill>
          <Avatar
            background={selected ? 'background' : strategySeries?.endColor.toString().concat('20')}
            style={{
              boxShadow: `inset 1px 1px 2px ${strategySeries?.endColor.toString().concat('69')}`,
            }}
          >
            {<YieldMark colors={[strategySeries?.startColor!, strategySeries?.endColor!]} /> || <FiSlash />}
          </Avatar>
          <Box align="center" fill="vertical" justify="center">
            <Box direction="row">
              <Text size="small" color={selected ? strategySeries?.textColor : 'text-weak'}>
                {formatStrategyName(strategy.name!)}
              </Text>
            </Box>

            <Text size="xsmall" color={selected ? strategySeries?.textColor : 'text-weak'}>
              Rolling {displayName}
            </Text>
          </Box>
        </Box>

        {strategy.rewardsRate!.gt(ZERO_BN) && (
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
              background={selected ? 'background' : strategySeries?.endColor.toString().concat('20')}
              style={{
                boxShadow: `inset 1px 1px 2px ${strategySeries?.endColor.toString().concat('69')}`,
              }}
            >
              <Text size="small">{(+returns.blendedAPY - +returns.rewardsAPY!).toFixed(1)}%</Text>
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
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);
  const {
    seriesEntities: { data: seriesEntities },
  } = useSeriesEntities();

  const { userState, userActions } = useContext(UserContext);

  const { selectedStrategy, selectedBase, strategiesLoading, strategyMap } = userState;
  const [options, setOptions] = useState<IStrategy[]>([]);

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts = Array.from(strategyMap?.values()!);
    const filteredOpts = opts
      .filter((_st) => _st.type === 'V2' || (_st.type === 'V1' && !_st.associatedStrategy))
      .filter((_st) => seriesEntities?.get(_st.currentSeriesId!)?.showSeries && _st.active)
      .filter(
        (_st) => _st.baseId === selectedBase?.proxyId && !seriesEntities?.get(_st.currentSeriesId!)?.seriesIsMature
      )
      .sort(
        (a, b) =>
          seriesEntities?.get(a.currentSeriesId!)?.maturity! - seriesEntities?.get(b.currentSeriesId!)?.maturity!
      );
    setOptions(filteredOpts);
  }, [selectedBase, strategyMap, selectedStrategy, seriesEntities]);

  const handleSelect = (_strategy: IStrategy) => {
    console.log('SELECTED: ', _strategy.address, 'VERSION: ', _strategy.type);
    if (_strategy.active) {
      diagnostics && console.log('Strategy selected: ', _strategy.address);
      userActions.setSelectedStrategy(_strategy);
      userActions.setSelectedSeriesId(_strategy.currentSeriesId!);
    } else {
      toast.info('Strategy coming soon');
    }
  };

  /* Auto select a default strategy  */
  useEffect(() => {
    /* if strategy already selected, no need to set explicitly again */
    if (selectedStrategy) return;
    const opts: IStrategy[] = Array.from(strategyMap.values())
      .filter((_st) => _st.type === 'V2' || (_st.type === 'V1' && !_st.associatedStrategy))
      .filter((_st) => seriesEntities?.get(_st.currentSeriesId!)?.showSeries && _st.active)
      .filter(
        (_st) => _st.baseId === selectedBase?.proxyId && !seriesEntities?.get(_st.currentSeriesId!)?.seriesIsMature
      );

    /* select strategy with rewards */
    const strategyWithRewards = opts.find((s) => s.rewardsRate?.gt(ZERO_BN));
    if (strategyWithRewards) {
      userActions.setSelectedStrategy(strategyWithRewards);
      return;
    }
    /* select strategy with existing balance */
    const strategyWithBalance = opts.find((_st) => _st?.accountBalance?.gt(ZERO_BN));
    if (strategyWithBalance) {
      userActions.setSelectedStrategy(strategyWithBalance);
      return;
    }
    /* else set a random one as a last resort */
    userActions.setSelectedStrategy(opts[Math.floor(Math.random() * opts.length)]);
  }, [selectedBase, strategyMap]);

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
          {options.map((o) => {
            const displayName = seriesEntities?.get(o.currentSeriesId!)?.displayName!;
            const selected = selectedStrategy?.address === o.address;
            return (
              <StrategySelectItem
                key={o.address}
                strategy={o}
                handleClick={() => handleSelect(o)}
                selected={selected}
                displayName={displayName}
                input={inputValue}
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

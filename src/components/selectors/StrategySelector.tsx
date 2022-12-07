import { useContext, useEffect, useState } from 'react';
import { Avatar, Box, Text } from 'grommet';
import { toast } from 'react-toastify';
import { FiSlash } from 'react-icons/fi';

import styled from 'styled-components';
import { ISettingsContext, IStrategy, IUserContext, IUserContextActions, IUserContextState } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { formatStrategyName, nFormatter } from '../../utils/appUtils';
import Skeleton from '../wraps/SkeletonWrap';
import { SettingsContext } from '../../contexts/SettingsContext';
import { ZERO_BN } from '../../utils/constants';
import useStrategyReturns from '../../hooks/useStrategyReturns';
import { MdLocalOffer } from 'react-icons/md';
import { relative } from 'path';

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
  apy,
}: {
  strategy: IStrategy;
  selected: boolean;
  displayName: string;
  handleClick: (strategy: IStrategy) => void;
  apy?: string;
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

            <Box direction='row'>
            <Text size="small" color={selected ? strategy.currentSeries?.textColor : 'text-weak'}>
              {formatStrategyName(strategy.name!)}
            </Text>
 
        </Box>

            <Text size="xsmall" color={selected ? strategy.currentSeries?.textColor : 'text-weak'}>
              Rolling {displayName}
            </Text>
          </Box>
        </Box>

        {strategy.rewardsRate.gt(ZERO_BN) && (
          <Box round background="red" pad="xsmall" style={{ position: 'absolute', marginTop:'-1em', marginLeft:'17em'}}>
            <Text size="0.5em" color="white">
              Extra Rewards
            </Text>
          </Box>
        )}

        {apy && (
          <Box fill align="end">
            <Avatar
              background={selected ? 'background' : strategy.currentSeries?.endColor.toString().concat('20')}
              style={{
                boxShadow: `inset 1px 1px 2px ${strategy.currentSeries?.endColor.toString().concat('69')}`,
              }}
            >
              <Text size="small">{+apy > 999 ? nFormatter(+apy, 1) : apy}%</Text>
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
  } = useContext(SettingsContext) as ISettingsContext;

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
  };

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts: IStrategy[] = Array.from(strategyMap.values())
      .filter((_st) => _st.currentSeries?.showSeries)
      .filter((_st: IStrategy) => _st.baseId === selectedBase?.proxyId && !_st.currentSeries?.seriesIsMature);
    const strategyWithBalance = opts.find((_st) => _st?.accountBalance?.gt(ZERO_BN));

    // if strategy already selected, no need to set explicitly again
    if (selectedStrategy) return;

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

            .reduce((prev, curr) => {
              // if there are rewards on Offer, select that strategy:
              if (prev.rewardsRate.gt(ZERO_BN) || curr.rewardsRate.gt(ZERO_BN))
                return parseInt(prev.rewardsRate.toString(), 10) > parseInt(prev.rewardsRate.toString(), 10)
                  ? prev
                  : curr;
              // else selec tthe one with lowest suppy:
              return parseInt(prev.poolTotalSupply_!, 10) < parseInt(curr.poolTotalSupply_!, 10) ? prev : curr;
            })
        );
      /* or select random strategy from opts */
      userActions.setSelectedStrategy(opts[Math.floor(Math.random() * opts.length)]);
    }
  }, [selectedBase, strategyMap]);

  return (
    <Box>
      {strategiesLoading && (
        <>
          <Skeleton width={180} />
          <CardSkeleton />
          <CardSkeleton />
        </>
      )}

      <Box gap="small">
        {options.map((o) => {
          const displayName = seriesMap.get(o.currentSeriesId!)?.displayName!;
          const returns = calcStrategyReturns(o, inputValue && +inputValue !== 0 ? inputValue : '1');
          const selected = selectedStrategy?.address === o.address;
          return (
            <StrategySelectItem
              key={o.address}
              strategy={o}
              handleClick={() => handleSelect(o)}
              selected={selected}
              displayName={displayName}
              apy={returns.blendedAPY}
            />
          );
        })}
      </Box>
    </Box>
  );
};

StrategySelector.defaultProps = {
  inputValue: undefined,
};

export default StrategySelector;

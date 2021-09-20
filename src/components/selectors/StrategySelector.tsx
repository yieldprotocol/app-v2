import React, { useContext, useEffect, useState } from 'react';
import { Avatar, Box, Grid, ResponsiveContext, Select, Text } from 'grommet';
import { toast } from 'react-toastify';
import { FiSlash } from 'react-icons/fi';

import Skeleton from 'react-loading-skeleton';
import { ethers } from 'ethers';
import styled from 'styled-components';
import { ActionType, ISeries, IStrategy } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { useApr } from '../../hooks/useApr';
import { nFormatter } from '../../utils/appUtils';


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
  const { selectedStrategyAddr, selectedBaseId, seriesMap, assetMap, strategiesLoading, strategyMap } = userState;

  const [options, setOptions] = useState<IStrategy[]>([]);

  // const selectedBase = assetMap.get(selectedBaseId!);
  // const selectedStrategy: IStrategy = strategyMap.get(selectedStrategyAddr);
  // const series: ISeries = seriesMap.get(selectedStrategy?.currentSeries);

  const optionText = (_series: ISeries | undefined) => {
    if (_series) {
      return `${mobile ? _series?.displayNameMobile : _series?.displayName}`;
    }
    return 'Select a maturity date';
  };

  const optionExtended = (_series: ISeries | undefined) => (
    <Box fill="horizontal" direction="row" justify="between" gap="small">
      <Box align="center">{_series?.seriesMark} </Box>
      {optionText(_series)}
      {_series?.seriesIsMature && (
        <Box round="large" border pad={{ horizontal: 'small' }}>
          <Text size="xsmall"> Mature </Text>
        </Box>
      )}
      {/* <AprText inputValue={inputValue} series={_series!} actionType={ActionType.POOL} /> */}
    </Box>
  );

  /* Keeping options/selection fresh and valid: */
  useEffect(() => {
    const opts = Array.from(strategyMap.values()) as IStrategy[];

    const filteredOpts = opts.filter((_st: IStrategy) => _st.baseId === selectedBaseId && _st.currentSeries );
    // .filter((_st: IStrategy) => _st.currentSeries);
    setOptions(filteredOpts);
  }, [selectedBaseId, strategyMap]);

  const handleSelect = (_strategy: IStrategy) => {
    if (_strategy.active) {
      console.log('Strategy selected: ', _strategy.address);
      userActions.setSelectedStrategy(_strategy.address);
      userActions.setSelectedSeries(_strategy.currentSeries?.id);
    } else { 
      toast.info('Strategy coming soon')
      console.log('strategy not yet active')
    }
  };

  return (
    <>
      {strategiesLoading && <Skeleton width={180} />}
      {/* 
      {!cardLayout && (
        <InsetBox fill="horizontal" round="xsmall">
          <Select
            plain
            dropProps={{ round: 'xsmall' }}
            id="seriesSelect"
            name="seriesSelect"
            placeholder="Select Series"
            options={options}
            value={selectedSeries}
            labelKey={(x: any) => optionText(x)}
            valueLabel={
              options.length ? (
                <Box pad={mobile ? 'medium' : '0.55em'}>
                  <Text color="text"> {optionExtended(selectedSeries)}</Text>
                </Box>
              ) : (
                <Box pad={mobile ? 'medium' : '0.55em'}>
                  <Text color="text-weak"> No available series yet.</Text>
                </Box>
              )
            }
            disabled={options.length === 0}
            onChange={({ option }: any) => handleSelect(option)}
            // eslint-disable-next-line react/no-children-prop
            children={(x: any) => (
              <Box pad={mobile ? 'medium' : 'small'} gap="small" direction="row">
                <Text color="text"> {optionExtended(x)}</Text>
              </Box>
            )}
          />
        </InsetBox>
      )} */}

      {cardLayout && (

<Box overflow={mobile?undefined:"auto"} height={mobile?undefined:"250px"} pad="xsmall" >
        <Grid columns={mobile ? '100%' : '40%'} gap="small" >
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
                background={strategy.address === selectedStrategyAddr ? strategy.currentSeries?.color :'solid'}
                elevation="xsmall"
                align="center"
              >
                <Box pad="small" width="small" direction="row" align="center" gap="small">
                  <Avatar background="solid"> {strategy.currentSeries?.seriesMark || <FiSlash />}</Avatar>
                  <Box>
                    <Text size="medium" color={strategy.address === selectedStrategyAddr ? strategy.currentSeries?.textColor : undefined}>
                        {strategy.name}
                     </Text>
                    <Text size="small" color={strategy.address === selectedStrategyAddr ? strategy.currentSeries?.textColor : undefined}>
                        {!strategy.active ? 'Coming soon' : `${strategy.returnRate_}%`}
                    </Text>
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

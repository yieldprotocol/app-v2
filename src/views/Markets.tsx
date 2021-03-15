import React, { useContext, useState, useRef, useEffect } from 'react';
import { Box, Button, Collapsible, Menu, ResponsiveContext, Text, TextInput } from 'grommet';

import { useHistory } from 'react-router-dom';
import { VaultContext } from '../contexts/VaultContext';
import MainViewWrap from '../components/wraps/MainViewWrap';
import { IYieldSeries } from '../types';
import SectionWrap from '../components/wraps/SectionWrap';
import AllMarkets from '../components/AllMarkets';
import MarketSupply from '../components/MarketSupply';
import MarketBorrow from '../components/MarketBorrow';

const Markets = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const routerHistory = useHistory();

  /* state from context */
  const { vaultState } = useContext(VaultContext);
  const { seriesMap } = vaultState;

  /* local state */
  const [inputValue, setInputValue] = useState<any>(undefined);
  const [expanded, setExpanded] = useState<any>(undefined);

  const [availableSeries, setAvailableSeries] = useState<IYieldSeries[]>([]);

  /* init effects */
  useEffect(() => {
    setAvailableSeries(Array.from(seriesMap.values())); // add some filtering here
  }, [seriesMap]);

  return (
    <MainViewWrap fullWidth>

      <SectionWrap>
        <Box
          direction="row"
          justify="between"
          fill="horizontal"
          align="center"
          gap="large"
        >
          <Text size={mobile ? 'small' : undefined}> Markets overview</Text>
          <Box border pad="xsmall">
            <Text size={mobile ? 'xsmall' : 'small'} color="text-weak">My markets</Text>
          </Box>
        </Box>

        <Box
          direction="row-responsive"
          fill
          gap={mobile ? 'small' : 'large'}
          height={{ min: '300px' }}
        >
          <Box border fill>
            <MarketSupply />
          </Box>
          <Box border fill>
            <MarketBorrow />
          </Box>
        </Box>
      </SectionWrap>

      <SectionWrap>
        <Text size={mobile ? 'small' : undefined} alignSelf="start"> All Markets</Text>
        <Box border fill overflow="auto">
          <AllMarkets />
        </Box>
      </SectionWrap>

    </MainViewWrap>);
};

export default Markets;

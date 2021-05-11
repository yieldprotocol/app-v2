import React, { useContext, useState } from 'react';
import { Box, Button, RadioButtonGroup, ResponsiveContext, Text, TextInput } from 'grommet';

import { cleanValue } from '../utils/displayUtils';
import AssetSelector from '../components/selectors/AssetSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import ActionButtonGroup from '../components/ActionButtonGroup';
import PlaceholderWrap from '../components/wraps/PlaceholderWrap';
import SectionWrap from '../components/wraps/SectionWrap';
import { UserContext } from '../contexts/UserContext';
import { ISeries, IUserContext } from '../types';
import { usePoolActions } from '../hooks/poolActions';

function Pool() {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const [inputValue, setInputValue] = useState<any>(undefined);
  const [strategy, setStrategy] = useState<'BUY'|'MINT'>('BUY');
  const [rollToSeries, setRollToSeries] = useState<ISeries|null>(null);

  /* state from context */
  const { userState } = useContext(UserContext) as IUserContext;
  const { seriesMap, selectedSeriesId, selectedBaseId } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);

  const { addLiquidity, removeLiquidity, rollLiquidity } = usePoolActions();

  const handleAdd = () => {
    // !lendDisabled &&
    selectedSeries && addLiquidity(inputValue, selectedSeries, strategy);
  };

  const handleRemove = () => {
    // !lendDisabled &&
    selectedSeries && removeLiquidity('1', selectedSeries);
  };

  const handleRollLiquidity = () => {
    // !lendDisabled &&
    selectedSeries && rollToSeries && rollLiquidity(inputValue, selectedSeries, rollToSeries);
  };

  return (
    <MainViewWrap>
      <SectionWrap title="1. Asset to Pool" subtitle="Choose an asset and series to pool">
        <Box direction="row" gap="small" fill="horizontal">
          <InputWrap action={() => console.log('maxAction')}>
            <TextInput
              plain
              type="number"
              placeholder={<PlaceholderWrap label="Enter amount" />}
              value={inputValue || ''}
              onChange={(event:any) => setInputValue(cleanValue(event.target.value))}
            />
            {
              !mobile &&
              <Box onClick={() => console.log('max clicked ')} pad="xsmall">
                <Text size="xsmall" color="text">MAX</Text>
              </Box>
            }
          </InputWrap>
          <Box basis={mobile ? '50%' : '35%'}>
            <AssetSelector />
          </Box>
        </Box>

      </SectionWrap>

      <SectionWrap title={`2. Select a series ${mobile ? '' : '(maturity date)'} `}>
        <SeriesSelector />

        <Box justify="evenly" gap="small" fill="horizontal" direction="row-responsive">
          {
            selectedSeries?.baseId === selectedBaseId &&
            <InfoBite label="Your pool tokens" value={selectedSeries?.poolTokens_!} />
          }
        </Box>

      </SectionWrap>

      <Box direction="row" justify="between">
        {!mobile && <Text size="small"> Pooling strategy: </Text>}
        <RadioButtonGroup
          name="strategy"
          options={[
            { label: <Text size="small"> Buy & Pool </Text>, value: 'BUY' },
            { label: <Text size="small"> Borrow & Pool </Text>, value: 'BORROW' },
          ]}
          value={strategy}
          onChange={(event:any) => setStrategy(event.target.value)}
          direction="row"
          justify="between"
        />
      </Box>

      <ActionButtonGroup buttonList={[
        <Button
          primary
          label={<Text size={mobile ? 'small' : undefined}> {`Pool ${inputValue || ''} Dai`}</Text>}
          key="primary"
          onClick={() => handleAdd()}

        />,
        <Button
          secondary
          label={<Text size={mobile ? 'small' : undefined}> Remove Liquidity </Text>}
          key="secondary"
          onClick={() => handleRemove()}
        />,
      ]}
      />

      <SectionWrap
        title="Roll Liquidity to:"
        border={{
          color: 'grey',
          style: 'dashed',
          side: 'all',
        }}
      >
        <Box gap="small" fill="horizontal" direction="row" align="center">

          <SeriesSelector selectSeriesLocally={(series:ISeries) => setRollToSeries(series)} />

          <Box basis="35%">
            <ActionButtonGroup buttonList={[
              <Button
                primary
                label={<Text size={mobile ? 'small' : undefined}> Roll </Text>}
                key="primary"
                onClick={() => handleRollLiquidity()}
              />,
            ]}
            />
          </Box>
        </Box>
      </SectionWrap>

    </MainViewWrap>
  );
}

export default Pool;

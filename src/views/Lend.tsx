import { Box, Button, ResponsiveContext, Text, TextInput } from 'grommet';
import React, { useContext, useState } from 'react';
import ActionButtonGroup from '../components/ActionButtonGroup';
import AssetSelector from '../components/selectors/AssetSelector';
import InfoBite from '../components/InfoBite';
import InputWrap from '../components/wraps/InputWrap';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import { cleanValue } from '../utils/displayUtils';
import PlaceholderWrap from '../components/wraps/PlaceholderWrap';
import SectionWrap from '../components/wraps/SectionWrap';

import { useLendActions } from '../hooks/lendActions';
import { UserContext } from '../contexts/UserContext';
import { ISeries, IUserContext } from '../types';

const Lend = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  const [inputValue, setInputValue] = useState<string>();
  const [closeInputValue, setCloseInputValue] = useState<string>();
  const [rollToSeries, setRollToSeries] = useState<ISeries|null>(null);

  /* state from context */
  const { userState } = useContext(UserContext) as IUserContext;
  const { selectedSeriesId, selectedBaseId, seriesMap, assetMap } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  const { lend, closePosition, rollPosition } = useLendActions();

  const handleLend = () => {
    // !lendDisabled &&
    selectedSeries && lend(inputValue, selectedSeries);
  };

  const handleClosePosition = () => {
    // !lendDisabled &&
    selectedSeries && closePosition(inputValue, selectedSeries);
  };

  const handleRollPosition = () => {
    // !lendDisabled &&
    selectedSeries && rollToSeries && rollPosition(inputValue, selectedSeries, rollToSeries);
  };

  return (
    <MainViewWrap>

      <SectionWrap title="1. Asset to Lend" subtitle="Choose an asset and period to lend for">
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
            <InfoBite label="FYToken balance" value={selectedSeries?.fyTokenBalance_!} />
          }
        </Box>
      </SectionWrap>

      <ActionButtonGroup buttonList={[
        <Button
          primary
          label={<Text size={mobile ? 'small' : undefined}> {`Supply ${inputValue || ''} ${selectedBase?.symbol || ''}`} </Text>}
          key="primary"
          onClick={() => handleLend()}
        />,
        // <Button
        //   secondary
        //   label={<Text size={mobile ? 'small' : undefined}>Close Position</Text>}
        //   key="secondary"
        //   onClick={() => handleClosePosition()}
        // />,
      ]}
      />

      <SectionWrap
        title="Close position"
        border={{
          color: 'grey',
          style: 'dashed',
          side: 'all',
        }}
      >
        <Box direction="row" gap="small" fill="horizontal">
          <InputWrap action={() => console.log('maxAction')}>
            <TextInput
              plain
              type="number"
              placeholder={<PlaceholderWrap label="Enter amount" />}
              value={closeInputValue || ''}
              onChange={(event:any) => setCloseInputValue(cleanValue(event.target.value))}
            />
          </InputWrap>
          <Box basis={mobile ? '50%' : '35%'}>
            <AssetSelector />
          </Box>
        </Box>

        <ActionButtonGroup buttonList={[
          <Button
            secondary
            label={<Text size={mobile ? 'small' : undefined}>Close Position</Text>}
            key="secondary"
            onClick={() => handleClosePosition()}
          />,
        ]}
        />
      </SectionWrap>

      <SectionWrap
        title="Roll Position to:"
        border={{
          color: 'grey',
          style: 'dashed',
          side: 'all',
        }}
      >
        <Box gap="small" fill="horizontal" direction="row" align="center">

          <SeriesSelector setSeriesLocally={(series:ISeries) => setRollToSeries(series)} />

          <Box basis="35%">
            <ActionButtonGroup buttonList={[
              <Button
                primary
                label={<Text size={mobile ? 'small' : undefined}> Roll </Text>}
                key="primary"
                onClick={() => handleRollPosition()}
              />,
            ]}
            />
          </Box>
        </Box>
      </SectionWrap>

    </MainViewWrap>
  );
};

export default Lend;

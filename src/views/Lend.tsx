import { Box, Button, ResponsiveContext, Select, Text, TextInput } from 'grommet';
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

import { useActions } from '../hooks/actionHooks';
import { UserContext } from '../contexts/UserContext';

const Lend = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const [inputValue, setInputValue] = useState<string>();

  const [closeInputValue, setCloseInputValue] = useState<string>();

  const { userState: { seriesMap, selectedSeriesId, selectedBaseId } } = useContext(UserContext);

  const selectedSeries = seriesMap.get(selectedSeriesId);

  const { lend, closePosition } = useActions();

  const handleLend = () => {
    // !lendDisabled &&
    lend(inputValue, selectedSeries);
  };

  const handleClosePosition = () => {
    // !lendDisabled &&
    closePosition('1', selectedSeries);
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
            <InfoBite label="FYToken balance" value={selectedSeries?.fyTokenBalance_} />
          }
        </Box>
      </SectionWrap>

      <ActionButtonGroup buttonList={[
        <Button
          primary
          label={<Text size={mobile ? 'small' : undefined}> {`Supply ${inputValue || ''} Dai`} </Text>}
          key="primary"
          onClick={() => handleLend()}
        />,

        <Button
          secondary
          label={<Text size={mobile ? 'small' : undefined}>Close Position</Text>}
          key="secondary"
          onClick={() => handleClosePosition()}
        />,
      ]}
      />

      {/* <SectionWrap title="Testing section: Closing position">
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
      </SectionWrap> */}

    </MainViewWrap>
  );
};

export default Lend;

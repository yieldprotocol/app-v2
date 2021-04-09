import React, { useContext, useState } from 'react';
import { Box, Button, RadioButtonGroup, ResponsiveContext, Text, TextInput } from 'grommet';

import { cleanValue } from '../utils/displayUtils';
import AssetSelector from '../components/AssetSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/SeriesSelector';
import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import ActionButtonGroup from '../components/ActionButtonGroup';
import PlaceholderWrap from '../components/wraps/PlaceholderWrap';
import SectionWrap from '../components/wraps/SectionWrap';

function Pool() {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const [inputValue, setInputValue] = useState<any>(undefined);
  const [strategy, setStrategy] = useState('c1');

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

        <Box justify="evenly" gap="small" fill="horizontal" direction="row-responsive">
          <InfoBite label="Your pool tokens" value="0.00" />
          <InfoBite label="Your pool share" value="0.00000%" />
          <InfoBite label="Total liquidity" value="30.95k tokens" />
        </Box>

      </SectionWrap>

      <SectionWrap title={`2. Select a series ${mobile ? '' : '(maturity date)'} `}>
        <SeriesSelector />
      </SectionWrap>

      <Box direction="row" justify="between">
        {!mobile && <Text size="small"> Pooling strategy: </Text>}
        <RadioButtonGroup
          name="strategy"
          options={[
            { label: <Text size="small"> Buy & Pool </Text>, value: 'c1' },
            { label: <Text size="small"> Borrow & Pool </Text>, value: 'c2' },
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
        />,
        <Button
          secondary
          label={<Text size={mobile ? 'small' : undefined}> Remove Liquidity </Text>}
          key="secondary"
        />,
      ]}
      />

    </MainViewWrap>
  );
}

export default Pool;

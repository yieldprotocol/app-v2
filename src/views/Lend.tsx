import { Box, Button, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import React, { useContext, useState } from 'react';
import ActionButtonGroup from '../components/ActionButtonGroup';
import AssetSelector from '../components/AssetSelector';
import InfoBite from '../components/InfoBite';
import InputWrap from '../components/wraps/InputWrap';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/SeriesSelector';
import { cleanValue } from '../utils/displayUtils';
import PlaceholderWrap from '../components/wraps/PlaceholderWrap';
import SectionWrap from '../components/wraps/SectionWrap';

const Lend = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const [inputValue, setInputValue] = useState<string>();

  return (
    <MainViewWrap>

      <SectionWrap title="1. Asset to Lend" subtitle="Choose an asset and period to lend for">
        <Box direction="row" gap="small" fill="horizontal">
          <InputWrap basis="65%" action={() => console.log('maxAction')}>
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
          <Box basis="35%">
            <AssetSelector />
          </Box>
        </Box>

        <Box justify="evenly" gap="small" fill="horizontal" direction="row-responsive">
          <InfoBite label="Portfolio Value:" value="100 DAI" />
          <InfoBite label="Current Value:" value="99.34 DAI" />
        </Box>

      </SectionWrap>

      <SectionWrap title={`2. Select a series ${mobile ? '' : '(maturity date)'} `}>
        <SeriesSelector />
      </SectionWrap>

      <ActionButtonGroup buttonList={[

        <Button
          primary
          label={<Text size={mobile ? 'small' : undefined}> {`Supply ${inputValue || ''} Dai`} </Text>}
          key="primary"
        />,

        <Button
          secondary
          label={<Text size={mobile ? 'small' : undefined}>Close Position</Text>}
          key="secondary"
        />,
      ]}
      />

    </MainViewWrap>
  );
};

export default Lend;

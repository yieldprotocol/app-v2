import { Box, Button, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import React, { useContext, useState } from 'react';
import AssetSelector from '../components/AssetSelector';
import InfoBite from '../components/InfoBite';
import InputWrap from '../components/InputWrap';
import { MainViewWrap } from '../components/MainViewWrap';
import SeriesSelector from '../components/SeriesSelector';
import { cleanValue } from '../utils/displayUtils';

const Lend = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const [inputValue, setInputValue] = useState<string>();

  return (
    <MainViewWrap>

      <Box align="center" gap="small">

        <Text> 1. Asset to Lend </Text>
        <Text color="text-weak" size={mobile ? 'xsmall' : 'small'}> Choose an asset below and period to lend for </Text>

        <Box direction="row" gap="small">
          <InputWrap basis="65%" action={() => console.log('maxAction')}>
            <TextInput
              plain
              type="number"
              placeholder={<Text color="text"> Enter amount </Text>}
              // ref={(el:any) => { el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el); }}
              value={inputValue || ''}
              onChange={(event:any) => setInputValue(cleanValue(event.target.value))}
              // icon={mobile ? <DaiMark /> : undefined}
            />
            <Box onClick={() => console.log('max clicked ')} pad="xsmall">
              <Text size="xsmall" color="text">MAX</Text>
            </Box>
          </InputWrap>
          <Box basis="35%">
            <AssetSelector />
          </Box>
        </Box>

        <Box justify="evenly" gap="small" fill="horizontal" direction="row">
          <InfoBite label="Portfolio Value:" value="100 DAI" />
          <InfoBite label="Current Value:" value="99.34 DAI" />
        </Box>

      </Box>

      <Box align="center" gap="small" fill="horizontal">
        <Text> {`2. Select a series ${mobile ? '' : '(maturity date)'} `} </Text>
        <SeriesSelector />
      </Box>

      <Box gap="small">
        <Button primary label="Supply Dai" />
        <Button secondary label="Close Position" />
      </Box>

    </MainViewWrap>
  );
};

export default Lend;

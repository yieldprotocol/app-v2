import React, { useContext, useState } from 'react';
import { Box, Button, ResponsiveContext, Text, TextInput } from 'grommet';

import { cleanValue } from '../utils/displayUtils';
import AssetSelector from '../components/AssetSelector';
import { MainViewWrap } from '../components/MainViewWrap';
import SeriesSelector from '../components/SeriesSelector';
import InputWrap from '../components/InputWrap';
import InfoBite from '../components/InfoBite';

function Pool() {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const [inputValue, setInputValue] = useState<string>();

  return (
    <MainViewWrap>

      <Box align="center" gap="small">

        <Text> 1. Asset to Pool </Text>
        <Text color="text-weak" size={mobile ? 'xsmall' : 'small'}> Choose an asset and series to pool</Text>
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
          <InfoBite label="Your pool tokens" value="0.00" />
          <InfoBite label="Your pool share" value="0.00000%" />
          <InfoBite label="Total liquidity" value="30.95k tokens" />
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
}

export default Pool;

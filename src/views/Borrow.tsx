import React, { useContext, useState } from 'react';
import { Box, Button, Heading, ResponsiveContext, Select, Text, TextInput } from 'grommet';

import { cleanValue } from '../utils/displayUtils';

import SeriesSelector from '../components/SeriesSelector';
import { MainViewWrap } from '../components/MainViewWrap';
import AssetSelector from '../components/AssetSelector';
import InputWrap from '../components/InputWrap';
import InfoBite from '../components/InfoBite';

const Borrow = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const [inputValue, setInputValue] = useState<string>();

  return (
    <MainViewWrap>

      <Box align="center" gap="small">
        <Text> 1. Asset to Borrow </Text>
        <Text color="text-weak" size={mobile ? 'xsmall' : 'small'}> Choose an asset below and period to borrow for </Text>

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
          </InputWrap>
          <Box basis="35%">
            <AssetSelector />
          </Box>
        </Box>

        <Box justify="evenly" gap="small" fill="horizontal" direction="row">
          <InfoBite label="Borrowing Power:" value="100Dai" />
          <InfoBite label="Collateralization:" value="200%" />
        </Box>

      </Box>

      <Box align="center" gap="small" fill="horizontal">
        <Text> {`2. Select a series ${mobile ? '' : '(maturity date)'} `} </Text>
        <SeriesSelector />
      </Box>

      <Box align="center" gap="small">
        <Box> 3. Add Collateral </Box>

        <Box direction="row" gap="small" fill="horizontal" align="center">
          <InputWrap basis="65%" action={() => console.log('maxAction')}>
            <TextInput
              plain
              type="number"
              placeholder={<Text color="text"> Enter amount </Text>}
              // ref={(el:any) => { el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el); }}
              value={inputValue || ''}
              onChange={(event:any) => setInputValue(cleanValue(event.target.value))}
            />
          </InputWrap>
          <Box round="xsmall" pad="xsmall">
            <Text color="text"> ETH </Text>
          </Box>
        </Box>
      </Box>

      <Box gap="small" fill="horizontal">
        <Button primary label="Borrow Dai" />
        <Button secondary label="Migrate Maker Vault" />
      </Box>

    </MainViewWrap>
  );
};

export default Borrow;

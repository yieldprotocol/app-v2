import { Box, Button, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import React, { useContext, useState } from 'react';
import { MainViewWrap } from '../components/MainViewWrap';
import SeriesSelector from '../components/SeriesSelector';

const Lend = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const [asset, setAsset] = useState<string>('DAI');

  return (
    <MainViewWrap>

      <Box align="center" gap="small">

        <Text> 1. Asset to Borrow </Text>
        <Text color="text-weak" size={mobile ? 'xsmall' : 'small'}> Choose an asset below and period to borrow for </Text>

        <Box direction="row" gap="small">
          <TextInput
            placeholder="Enter amount"
            color="text-weak"
          />
          <Select
            options={['DAI', 'USDC', 'UNI']}
            value={asset}
            onChange={({ option }: any) => setAsset(option)}
          />
        </Box>

      </Box>

      <Box align="center" gap="small" fill="horizontal">
        <Text> {`2. Select a series ${mobile ? '' : '(maturity date)'} `} </Text>
        <SeriesSelector />
      </Box>

      <Box gap="small">
        <Button primary label="Borrow Dai" />
        <Button secondary label="Migrate Maker Vault" />
      </Box>

    </MainViewWrap>
  );
};

export default Lend;

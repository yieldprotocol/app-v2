import React, { useContext, useState } from 'react';
import { Box, Button, Heading, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import SeriesSelector from '../components/SeriesSelector';
import { MainViewWrap } from '../components/MainViewWrap';

const Borrow = () => {
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

      <Box align="center" gap="small">
        <Box> 3. Add Collateral </Box>

        <Box direction="row" gap="small" fill="horizontal">

          <TextInput
            placeholder="Enter amount"
            color="text-weak"
          />

          <Box border round="xsmall" pad="xsmall">
            <Text> ETH </Text>
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

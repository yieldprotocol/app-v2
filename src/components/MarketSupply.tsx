import React, { useContext, useState } from 'react';
import { Box, DataTable, List, Meter, ResponsiveContext, Text } from 'grommet';
import SectionWrap from './wraps/SectionWrap';

const MarketSupply = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  const data = [
    { market: 'DAI', percent: 86 },
    { market: 'USDC', percent: 40 },
    { market: 'DOGE', percent: 15 },
    { market: 'UNI', percent: 2 },
  ];
  const _data = mobile ? data.map((x:any, i:number) => i < 3 && x) : data;

  return (
    <Box pad="small" overflow="auto" gap="small">

      <Box pad="small">
        <Text size="small">Total Borrowed </Text>
        {!mobile && <Text size="xsmall" color="text-weak">(Top performing markets) </Text> }
      </Box>

      <List
        primaryKey={(x:any) => <Box key={x.market}><Text size="small"> { x.market }</Text></Box>}
        secondaryKey={(datum) => (
          <Box pad={{ vertical: 'xsmall' }} key={datum}>
            <Meter
              values={[{ value: datum.percent }]}
              thickness="small"
              size="small"
            />
          </Box>
        )}
        data={_data}
      />

    </Box>
  );
};

export default MarketSupply;

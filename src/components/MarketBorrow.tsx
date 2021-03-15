import React, { useContext, useState } from 'react';
import { Box, DataTable, List, Meter, ResponsiveContext, Text } from 'grommet';
import SectionWrap from './wraps/SectionWrap';

const MarketBorrow = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  const data = [
    { market: 'DAI', percent: 30 },
    { market: 'USDC', percent: 22 },
    { market: 'DOGE', percent: 9 },
    { market: 'UNI', percent: 3 },
  ];
  const _data = mobile ? data.map((x:any, i:number) => i < 3 && x) : data;

  return (
    <Box pad="small" overflow="auto" gap="small">

      <Box pad="small">
        <Text size="small">Total Lent </Text>
        {!mobile && <Text size="xsmall" color="text-weak">(Top performing markets) </Text> }
      </Box>

      <List
        border={false}
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
      {/* { (datum:any) => (
          <Box direction="row">
            <Text size="small"> { datum.market }</Text>
            <Box pad={{ vertical: 'xsmall' }}>
              <Meter
                values={[{ value: datum.percent }]}
                thickness="small"
                size="small"
              />
            </Box>
          </Box>

        )}

      </List> */}

    </Box>
  );
};

export default MarketBorrow;

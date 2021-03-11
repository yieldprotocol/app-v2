import React, { useContext, useState } from 'react';
import { Box, DataTable, Meter, ResponsiveContext, Text } from 'grommet';
import { nameFromMaturity } from '../utils/displayUtils';

export const columns = [
  {
    property: 'market',
    header: <Text size="small">Market</Text>,
    // primary: true,
    render: (x:any) => <Text size="small">{x.market}</Text>,
  },
  {
    property: 'series',
    header: <Text size="small"> Series </Text>,
    render: (x:any) => <Text size="small"> { nameFromMaturity(x.series) }</Text>,
  },
  {
    property: 'apy',
    header: <Text size="small"> APY (%) </Text>,
    render: (x:any) => <Text size="small"> {x.apy} </Text>,
    align: 'end',
  },
  {
    property: 'Action',
    header: '',
    render: (x:any) => (
      <Box direction="row" gap="small">
        <Box onClick={() => console.log(x)}> <Text size="small"> Borrow </Text> </Box>
        <Box onClick={() => console.log(x)}> <Text size="small"> Lend </Text> </Box>
      </Box>
    ),
    align: 'end',
  },

] as any[];

export const DATA = [
  {
    key: Math.random(),
    market: 'DAI',
    series: 1609459199,
    apy: 0,
  },
  {
    key: Math.random(),
    market: 'DAI',
    series: 1617235199,
    apy: 0,
  },
  {
    key: Math.random(),
    market: 'DAI',
    series: 1625097599,
    apy: 0,
  },
  {
    key: Math.random(),
    market: 'DAI',
    series: 1633046399,
    apy: 0,
  },
  {
    key: Math.random(),
    market: 'DAI',
    series: 1640995199,
    apy: 0,
  },
  {
    key: Math.random(),
    market: 'USDC',
    series: 1633046399,
    apy: 0,
  },

  {
    key: Math.random(),
    market: 'USDC',
    series: 1625097599,
    apy: 0,
  },
  {
    key: Math.random(),
    market: 'USDC',
    series: 1609459199,
    apy: 0,
  },
  {
    key: Math.random(),
    market: 'USDC',
    series: 1617235199,
    apy: 0,
  },
  {
    key: Math.random(),
    market: 'DOGE',
    series: 1609459199,
    apy: 0,
  },
  {
    key: Math.random(),
    market: 'UNI',
    series: 1609459199,
    apy: 0,
  },
];

const AllMarkets = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  const [sort, setSort] : any = React.useState({
    property: 'market',
    direction: 'asc',
  });

  const _columns = mobile ? columns.map((x:any, i:number) => i < 3 && x) : columns;

  return (
    <Box pad="small">

      <DataTable
        columns={_columns}
        primaryKey="key"
        data={DATA}
        onClickRow={(e:any) => console.log(e.datum)}
        sort={sort}
        onSort={setSort}
      />
    </Box>
  );
};

export default AllMarkets;

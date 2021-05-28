import { Box, Text } from 'grommet';
import React, { useContext } from 'react';
import Loader from 'react-spinners/GridLoader';
import { UserContext } from '../contexts/UserContext';
import { ISeries, IUserContext } from '../types';

interface IYieldApr {
  type: 'BORROW'|'LEND'
  input: string|undefined,
}

function YieldApr({ type, input }: IYieldApr) {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, vaultMap, seriesMap, selectedSeriesId, selectedIlkId, selectedBaseId } = userState;
  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);
  //   const selectedIlk = assetMap.get(selectedIlkId!);

  /* LOCAL STATE */
  // const [apr, setApr] = useState<string>();

  /* Get the min APR from all the series */
  const aprArray = Array.from(seriesMap.values())
    .filter((x:ISeries) => x.baseId === selectedBaseId)
    .map((x:ISeries) => parseFloat(x.APR));
  const minApr = aprArray.length && Math.min(...aprArray);
  const maxApr = aprArray.length && Math.min(...aprArray);

  return (

    <>
      <Box animation="fadeIn" basis="50%">
        <Box pad="large" />
        {
        type === 'BORROW'
          ?
            <Text size="xsmall">
              Borrow {input || ''} {selectedBase?.symbol || ''} {!selectedSeries || selectedSeries.seriesIsMature ? 'from' : 'at'}
            </Text>
          :
            <Text size="xsmall">
              Lend {input || ''} {selectedBase?.symbol || ''} {!selectedSeries ? 'for up to' : 'at'}
            </Text>
        }
        <Box direction="row" align="center">
          <Text size="70px" color="brand">
            {selectedSeries?.APR || (type === 'BORROW' ? minApr : maxApr) || ''}
          </Text>
          <Box fill="vertical" justify="evenly">
            <Text size="large" color="brand"> % </Text>
            <Text size="large" color="brand"> APR </Text>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default YieldApr;

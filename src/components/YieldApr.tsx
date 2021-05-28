import { ethers } from 'ethers';
import { Box, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import Loader from 'react-spinners/GridLoader';
import { UserContext } from '../contexts/UserContext';
import { ISeries, IUserContext } from '../types';
import { cleanValue } from '../utils/displayUtils';
import { buyBase, calculateAPR, secondsToFrom, sellBase } from '../utils/yieldMath';

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
  const [apr, setApr] = useState<string|undefined>();

  useEffect(() => {
    let preview: ethers.BigNumber | Error = ethers.constants.Zero;
    if (selectedSeries) {
      const baseAmount = ethers.utils.parseEther(input || '1');
      const { baseReserves, fyTokenReserves, maturity } = selectedSeries;
      const ttm = secondsToFrom(maturity.toString());

      if (type === 'LEND') preview = sellBase(baseReserves, fyTokenReserves, baseAmount, ttm);
      if (type === 'BORROW') preview = buyBase(baseReserves, fyTokenReserves, baseAmount, ttm);

      const _apr = calculateAPR(baseAmount, preview, selectedSeries?.maturity);
      console.log(_apr && cleanValue(_apr, 2));
      _apr ? setApr(cleanValue(_apr, 2)) : setApr(selectedSeries.APR);

      console.log(baseReserves.toString());
    } else {
      // setApr(selectedSeries.APR)
      // selectedSeries?.APR && setApr(selectedSeries.APR);
    }
    // setFYDaiValue(parseFloat(ethers.utils.formatEther(preview)));
    // _apr = calculateAPR(ethers.utils.parseEther(inputValue.toString()), preview, activeSeries?.maturity);
    // setAPR(cleanValue(_apr.toString(), 2));
  }, [selectedSeries, input, type]);

  /* Get the min APR from all the series */
  const aprArray = Array.from(seriesMap.values())
    .filter((x:ISeries) => x.baseId === selectedBaseId)
    .map((x:ISeries) => parseFloat(x.APR));
  const minApr = aprArray.length && Math.min(...aprArray);
  const maxApr = aprArray.length && Math.min(...aprArray);

  return (
    <>
      {
      (minApr > 0) &&
      <Box animation="fadeIn" basis="50%">
        <Box pad="large" />
        {
        type === 'BORROW'
          ?
            <Text size="xsmall">
              Borrow {selectedSeries ? input : '' } {selectedBase?.symbol || ''} {!selectedSeries || selectedSeries.seriesIsMature ? 'from' : 'at'}
            </Text>
          :
            <Text size="xsmall">
              Lend {selectedSeries && (input || '')} {selectedBase?.symbol || ''} {!selectedSeries ? 'for up to' : 'at'}
            </Text>
        }
        <Box direction="row" align="center">
          <Text size="70px" color="brand">
            {apr || (type === 'BORROW' ? minApr : maxApr) || ''}
          </Text>
          <Box fill="vertical" justify="evenly">
            <Text size="large" color="brand"> % </Text>
            <Text size="large" color="brand"> APR </Text>
          </Box>
        </Box>
      </Box>
      }
    </>
  );
}

export default YieldApr;

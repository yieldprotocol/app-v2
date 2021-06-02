import { ethers } from 'ethers';
import { Box, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import Loader from 'react-spinners/GridLoader';
import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { ISeries, IUserContext } from '../types';
import { cleanValue } from '../utils/displayUtils';
import { buyBase, calculateAPR, secondsToFrom, sellBase } from '../utils/yieldMath';

interface IYieldApr {
  type: 'BORROW'|'LEND'
  input: string|undefined,
}

const StyledText = styled(Text)`
  /* text-shadow: 0 0 3px #FF0000; */
  background: -webkit-linear-gradient(rgba(77,94,254,1),rgba(195,34,34,1));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

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
      (minApr > 0) ?
        <Box animation="fadeIn" basis="50%">
          <Box pad="large" />
          {
        type === 'BORROW'
          ?
            <Text size="medium" weight="bold">
              Borrow {selectedSeries ? cleanValue(input || '', 2) : '' } {selectedBase?.symbol || ''} {!selectedSeries || selectedSeries.seriesIsMature ? 'from' : 'at'}
            </Text>
          :
            <Text size="medium" weight="bold">
              Lend {selectedSeries && cleanValue(input || '', 2)} {selectedBase?.symbol || ''} {!selectedSeries ? 'for up to' : 'at'}
            </Text>
        }

          <Box direction="row" align="center">
            <StyledText size="80px">
              {apr || (type === 'BORROW' ? minApr : maxApr) || ''}
            </StyledText>
            <Box fill="vertical" justify="evenly">
              <StyledText size="large" color="brand"> % </StyledText>
              <StyledText size="large" color="brand"> APR </StyledText>
            </Box>
          </Box>

        </Box>
        :
        <Box pad="small" />
      }
    </>
  );
}

export default YieldApr;

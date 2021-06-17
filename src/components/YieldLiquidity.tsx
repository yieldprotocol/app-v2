import { ethers } from 'ethers';
import { Box, ResponsiveContext, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import Loader from 'react-spinners/GridLoader';
import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { useApr } from '../hooks/aprHook';
import { ActionType, ISeries, IUserContext } from '../types';
import { cleanValue, nFormatter } from '../utils/displayUtils';
import { buyBase, calculateAPR, secondsToFrom, sellBase } from '../utils/yieldMath';

interface IYieldApr {
  input: string|undefined,
}

const StyledText = styled(Text)`
  /* text-shadow: 0 0 3px #FF0000; */
  background: -webkit-linear-gradient(rgba(77,94,254,1),rgba(195,34,34,1));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: 'Bree Serif', serif;
  filter: drop-shadow(5px 5px 2px #DDD);
`;

function YieldApr({ input }: IYieldApr) {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, vaultMap, seriesMap, selectedSeriesId, selectedIlkId, selectedBaseId } = userState;
  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);
  //   const selectedIlk = assetMap.get(selectedIlkId!);

  /* LOCAL STATE */
  const [totalLiquidity, setTotalLiquidity] = useState<string>();

  useEffect(() => {
    if (selectedBase) {
      const baseId = selectedBase.id;
      let total: ethers.BigNumber = ethers.constants.Zero;
      seriesMap && seriesMap.forEach((x:ISeries) => {
        if (x.baseId === baseId) total = total.add(x.totalSupply);
      });
      console.log(ethers.utils.formatEther(total).toString());
      setTotalLiquidity(ethers.utils.formatEther(total).toString());
    }
  }, [seriesMap, selectedBase]);

  return (
    <>
      { true ?
        <Box animation="fadeIn" basis={mobile ? undefined : '50%'}>
          <Box pad={mobile ? undefined : 'large'} />

          <Box margin="-1em">
            <Text size="small" color="text-weak" weight="bold">
              Total Liquidity
            </Text>
            <Text size="medium" color="text-weak" weight="bold">
              { selectedSeries?.displayName! }
            </Text>
          </Box>

          <Box direction="row" align="center">
            <StyledText size="100px">

              {selectedSeries ?
                nFormatter(parseFloat(selectedSeries?.totalSupply_!), 2)
                : nFormatter(parseFloat(totalLiquidity!), 2)}
            </StyledText>
            <Box fill="vertical" justify="center">
              <StyledText size="small" color="brand"> Pool </StyledText>
              <StyledText size="small" color="brand"> Tokens </StyledText>
            </Box>
          </Box>

          <Text size="medium" color="text-weak" weight="bold">
            { !selectedSeries && `in all ${selectedBase?.symbol} series`}
          </Text>

        </Box>
        :
        <Box>
          {totalLiquidity}
        </Box>}
    </>
  );
}

export default YieldApr;

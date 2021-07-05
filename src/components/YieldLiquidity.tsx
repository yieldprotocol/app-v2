import { ethers } from 'ethers';
import { Box, ResponsiveContext, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { ISeries, IUserContext } from '../types';
import { nFormatter } from '../utils/appUtils';

interface IYieldApr {
  input: string|undefined,
}

const StyledText = styled(Text)`
  /* text-shadow: 0 0 3px #FF0000; */
  background: -webkit-linear-gradient(rgba(77,94,254,1),rgba(195,34,34,1));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: 'FoundryGridnik';
  font-weight: 'bold';
  filter: drop-shadow(10px 10px 2px #DDD);
`;

function YieldApr({ input }: IYieldApr) {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { assetMap, seriesMap, selectedSeriesId, selectedBaseId } = userState;
  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);

  /* LOCAL STATE */
  const [totalLiquidity, setTotalLiquidity] = useState<string>();

  useEffect(() => {
    if (selectedBase) {
      const baseId = selectedBase.id;
      let total: ethers.BigNumber = ethers.constants.Zero;
      seriesMap && seriesMap.forEach((x:ISeries) => {
        if (x.baseId === baseId) total = total.add(x.totalSupply);
      });
      setTotalLiquidity(ethers.utils.formatEther(total).toString());
    }
  }, [seriesMap, selectedBase]);

  return (
    <>
      { parseFloat(totalLiquidity!) > 0 ?
        <Box animation="fadeIn" basis={mobile ? undefined : '50%'}>
          <Box pad={mobile ? undefined : 'large'} />

          <Box margin="-1em">
            <Text size="small" color="text-weak" weight="bold">
              Total Liquidity
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
            { selectedSeries && `in the ${selectedSeries?.displayNameMobile} series`}
          </Text>

        </Box>
        :
        <Box />}
    </>
  );
}

export default YieldApr;

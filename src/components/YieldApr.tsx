import { ethers } from 'ethers';
import { Box, ResponsiveContext, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import Loader from 'react-spinners/GridLoader';
import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { useApr } from '../hooks/aprHook';
import { ActionType, ISeries, IUserContext } from '../types';
import { cleanValue } from '../utils/displayUtils';
import { buyBase, calculateAPR, secondsToFrom, sellBase } from '../utils/yieldMath';

interface IYieldApr {
  actionType: ActionType,
  input: string|undefined,
}

const StyledText = styled(Text)`
  /* text-shadow: 0 0 3px #FF0000; */
  background: -webkit-linear-gradient(rgba(77,94,254,1),rgba(195,34,34,1));
  background: ${(props) => props.color};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: 'FoundryGridnik';
  font-weight: bold;
  filter: drop-shadow(5px 5px 2px #DDD);
`;

function YieldApr({ actionType, input }: IYieldApr) {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, vaultMap, seriesMap, selectedSeriesId, selectedIlkId, selectedBaseId } = userState;
  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);
  //   const selectedIlk = assetMap.get(selectedIlkId!);

  const { apr, minApr, maxApr } = useApr(input, actionType, selectedSeries);

  return (
    <>
      {
      (minApr > 0) ?
        <Box animation="fadeIn">
          <Box pad={mobile ? undefined : 'large'} />
          {
          actionType === 'BORROW'
            ?
              <Text size="medium" color="text-weak" weight="bold" margin="-1em">
                Borrow {selectedSeries ? cleanValue(input || '', 2) : '' } {selectedBase?.symbol || ''} {!selectedSeries || selectedSeries.seriesIsMature ? 'from' : 'at'}
              </Text>
            :
              <Text size="medium" color="text-weak" weight="bold" margin="-1em">
                Lend {selectedSeries && cleanValue(input || '', 2)} {selectedBase?.symbol || ''} {!selectedSeries ? 'for up to' : 'at'}
              </Text>
          }
          <Box direction="row" align="center" justify="between" fill="horizontal">
            <StyledText size="100px" color={selectedSeries?.color}>
              {apr || (actionType === 'BORROW' ? minApr : maxApr) || ''}
            </StyledText>
            <Box fill="vertical" justify="evenly">
              <StyledText size="large" color={selectedSeries?.color}> % </StyledText>
              <StyledText size="large" color={selectedSeries?.color}> APR </StyledText>
            </Box>
          </Box>
        </Box>
        :
        <Box />
      }
    </>
  );
}

export default YieldApr;

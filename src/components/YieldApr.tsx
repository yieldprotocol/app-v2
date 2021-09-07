import { Box, ResponsiveContext, Text } from 'grommet';
import React, { useContext } from 'react';
import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { useApr } from '../hooks/useApr';
import { ActionType, IUserContext } from '../types';
import { cleanValue } from '../utils/appUtils';
import HandText from './texts/HandText';

interface IYieldApr {
  actionType: ActionType;
  input: string | undefined;
}

const StyledText = styled(Text)`
  /* text-shadow: 0 0 3px #FF0000; */
  background: -webkit-linear-gradient(#7255bd, #d95948);
  background: ${(props) => props.color};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: '' Rubrik '', cursive;
  font-weight: bold;
  filter: drop-shadow(10px 10px 2px #ddd);
`;

function YieldApr({ actionType, input }: IYieldApr) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, vaultMap, seriesMap, selectedSeriesId, selectedIlkId, selectedBaseId } = userState;
  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);
  //   const selectedIlk = assetMap.get(selectedIlkId!);

  const { apr, minApr, maxApr } = useApr(input, actionType, selectedSeries);

  return (
    <>
      {minApr > 0 || true ? (
        <Box animation="fadeIn">
          <Box pad={mobile ? undefined : 'large'} />
          {actionType === 'BORROW' ? (
            <HandText size="medium" color="text-weak" weight="bold" margin="-1em">
              Borrow {selectedSeries ? cleanValue(input || '', 2) : ''} {selectedBase?.symbol || ''}{' '}
              {!selectedSeries || selectedSeries.seriesIsMature ? 'from' : 'at'}
            </HandText>
          ) : (
            <HandText size="medium" color="text-weak" weight="bold" margin="-1em">
              Lend {selectedSeries && cleanValue(input || '', 2)} {selectedBase?.symbol || ''}{' '}
              {!selectedSeries ? 'for up to' : 'at'}
            </HandText>
          )}
          <Box direction="row" align="center" justify="between" fill="horizontal">
            <StyledText size="100px" color={selectedSeries?.color}>
              {apr || (actionType === 'BORROW' ? minApr : maxApr) || ''}
            </StyledText>
            <Box fill="vertical" justify="evenly">
              <StyledText size="large" color={selectedSeries?.color}>
                {' '}
                %{' '}
              </StyledText>
              <StyledText size="large" color={selectedSeries?.color}>
                {' '}
                APR{' '}
              </StyledText>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box />
      )}
    </>
  );
}

export default YieldApr;

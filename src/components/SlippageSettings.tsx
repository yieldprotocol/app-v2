import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Box, Grid, Text, TextInput } from 'grommet';
import { FiPercent } from 'react-icons/fi';
import { UserContext } from '../contexts/UserContext';
import { cleanValue } from '../utils/appUtils';
import { useCachedState } from '../hooks/generalHooks';

const Input = styled(TextInput)`
  padding-left: 0;
  padding-right: 0;
`;
const StyledBox = styled(Box)`
  :hover {
    border: 1px solid #1d4ed8;
  }
`;

const SlippageSettings = () => {
  const {
    userState: { slippageTolerance },
    userActions: { setSlippageTolerance },
  } = useContext(UserContext);

  const [input, setInput] = useState((slippageTolerance * 100).toString());
  const [, setCachedSlippageTolerance] = useCachedState('slippageTolerance', (slippageTolerance * 100).toString());

  const tolerances: number[] = [0.0001, 0.0005, 0.001];
  const validateInput = (tolerance: number) => (tolerance > 0 && tolerance < 1 ? tolerance : slippageTolerance);
  const customTolerance = !tolerances.includes(slippageTolerance);

  /* sets the slippage tolerance on input */
  useEffect(() => {
    const _slippageTolerance = validateInput(Number(cleanValue(input, 4)) / 100);
    setSlippageTolerance(_slippageTolerance);
    setCachedSlippageTolerance(_slippageTolerance);
  }, [input]);

  return (
    <Box gap="small">
      <Text size="small">Slippage Tolerance</Text>
      <Box direction="row" justify="between">
        <Grid
          gap="xsmall"
          align="center"
          columns={{
            count: tolerances.length + 1,
            size: 'auto',
          }}
        >
          {tolerances.map((tolerance) => (
            <StyledBox
              fill
              border={{ color: tolerance === slippageTolerance ? 'tailwind-blue' : '#BFDBFE' }}
              round="xsmall"
              key={tolerance}
              onClick={() => {
                setSlippageTolerance(tolerance);
                setCachedSlippageTolerance(tolerance);
              }}
              align="center"
              justify="center"
            >
              <Text>{`${tolerance * 100} %`}</Text>
            </StyledBox>
          ))}
          <Box direction="row" round="xsmall" border={{ color: customTolerance ? 'tailwind-blue' : '#dfe8f9' }}>
            <Input
              textAlign="center"
              style={{ paddingLeft: 'none', paddingRight: 'none' }}
              reverse
              plain
              type="number"
              placeholder=""
              value={input || ''}
              onChange={(event: any) => setInput(event.target.value)}
            />
            <Box pad="xsmall" align="center" justify="center">
              <FiPercent />
            </Box>
          </Box>
        </Grid>
      </Box>
    </Box>
  );
};

export default SlippageSettings;

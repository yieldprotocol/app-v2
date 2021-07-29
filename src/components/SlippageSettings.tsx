import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Box, Grid, Text, TextInput } from 'grommet';
import { FiPercent } from 'react-icons/fi';
import { UserContext } from '../contexts/UserContext';
import InputWrap from './wraps/InputWrap';
import { cleanValue } from '../utils/appUtils';

const Input = styled(TextInput)`
  padding-left: 0;
  padding-right: 0;
`;

const SlippageSettings = () => {
  const {
    userState: { slippageTolerance },
    userActions: { setSlippageTolerance },
  } = useContext(UserContext);

  const [input, setInput] = useState((slippageTolerance * 100).toString());

  const tolerances: number[] = [0.001, 0.005, 0.01];
  const validateInput = (tolerance: number) => (tolerance > 0 && tolerance < 1 ? tolerance : slippageTolerance);
  const customTolerance = !tolerances.includes(slippageTolerance);

  useEffect(() => {
    setSlippageTolerance(validateInput(Number(cleanValue(input, 4)) / 100));
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
            <Box
              fill
              border={{ color: tolerance === slippageTolerance ? 'brand' : ' #dfe8f9' }}
              round="xsmall"
              key={tolerance}
              hoverIndicator={{}}
              onClick={() => setSlippageTolerance(tolerance)}
              align="center"
              justify="center"
            >
              <Text>{`${tolerance * 100}%`}</Text>
            </Box>
          ))}
          <InputWrap border={{ color: customTolerance ? 'brand' : '#dfe8f9' }}>
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
            <Box margin="none" pad="none">
              <FiPercent />
            </Box>
          </InputWrap>
        </Grid>
      </Box>
    </Box>
  );
};

export default SlippageSettings;

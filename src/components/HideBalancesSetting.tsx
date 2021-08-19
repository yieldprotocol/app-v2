import React, { useContext } from 'react';
import styled from 'styled-components';
import { Box, Text, TextInput } from 'grommet';
import { UserContext } from '../contexts/UserContext';
import InputWrap from './wraps/InputWrap';

const Input = styled(TextInput)`
  padding-left: 0;
  padding-right: 0;
`;

const HideBalancesSetting = () => {
  const {
    userState: { hideBalancesSetting },
    userActions: { setHideBalancesSetting },
  } = useContext(UserContext);

  return (
    <Box gap="small">
      <Text size="small">Hide Balances Below</Text>
      <InputWrap border={{ color: 'tailwind-blue' }} width="40%">
        <Input
          textAlign="center"
          style={{ paddingLeft: 'none', paddingRight: 'none' }}
          reverse
          plain
          type="number"
          placeholder=".01"
          value={hideBalancesSetting || ''}
          onChange={(event: any) => setHideBalancesSetting(event.target.value !== '' ? event.target.value : null)}
        />
      </InputWrap>
    </Box>
  );
};

export default HideBalancesSetting;

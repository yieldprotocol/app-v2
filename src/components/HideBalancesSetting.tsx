import React, { useContext } from 'react';
import styled from 'styled-components';
import { FiInfo } from 'react-icons/fi';
import { Box, Text, TextInput, Tip } from 'grommet';
import { UserContext } from '../contexts/UserContext';
import InputWrap from './wraps/InputWrap';

const Input = styled(TextInput)`
  padding-left: 0;
  padding-right: 0;
`;

const HideBalancesSetting = ({ settingName, settingValue }: { settingName: string; settingValue: string | null }) => {
  const {
    userActions: { setDashSettings },
  } = useContext(UserContext);

  return (
    <Box gap="xsmall">
      <Box direction="row" gap="xsmall" justify="start">
        <Text size="xsmall">Hide Balances Below</Text>
      </Box>
      <InputWrap border={{ color: 'tailwind-blue' }}>
        <Input
          textAlign="center"
          style={{ paddingLeft: 'none', paddingRight: 'none' }}
          reverse
          plain
          type="number"
          placeholder=".01"
          value={settingValue || ''}
          onChange={(event: any) => setDashSettings(settingName, event.target.value !== '' ? event.target.value : null)}
        />
      </InputWrap>
    </Box>
  );
};

export default HideBalancesSetting;

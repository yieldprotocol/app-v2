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

const HideBalancesSetting = (props: any) => {
  const {
    userState: { hideBalancesSetting },
    userActions: { setHideBalancesSetting },
  } = useContext(UserContext);

  return (
    <Box gap="xsmall">
      <Box direction="row" gap="xsmall">
        <Text size="small">Hide Balances Below</Text>
        <Tip content={<Text size="xsmall">in position balance</Text>} dropProps={{ align: { left: 'right' } }}>
          <Text size="small">
            <FiInfo />
          </Text>
        </Tip>
      </Box>
      <InputWrap border={{ color: 'tailwind-blue' }} width={props.width}>
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

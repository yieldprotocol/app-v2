import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { Text, Box, ResponsiveContext, Layer, Spinner } from 'grommet';
import { FiCheckCircle, FiCircle, FiMenu, FiSettings } from 'react-icons/fi';

import YieldBalances from './YieldBalances';

import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';

import { abbreviateHash } from '../utils/appUtils';
import YieldAvatar from './YieldAvatar';
import YieldSettings from './YieldSettings';
import Connect from './Connect';
import { TxState } from '../types';
import TransactionWidget from './TransactionWidget';
import ConnectButton from './buttons/ConnectButton';
import EthMark from './logos/EthMark';
import { UserContext } from '../contexts/UserContext';
import { WETH } from '../utils/constants';


const StyledText = styled(Text)`
  svg,
  span {
    vertical-align: middle;
  }
`;

const YieldAccount = (props: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    chainState: { account, chainData },
  } = useContext(ChainContext);

  const {
    userState: { assetMap },
  } = useContext(UserContext);

  const {
    txState: { sigPending, txPending, processPending },
  } = useContext(TxContext);

  const [settingsOpen, setSettingsOpen] = useState<boolean>();
  const [connectOpen, setConnectOpen] = useState<boolean>();

  const ethBalance = assetMap.get(WETH)?.balance_;

  return (
    <>
      {connectOpen && (
        <Layer onClickOutside={() => setConnectOpen(false)} onEsc={() => setConnectOpen(false)}>
          <Connect setConnectOpen={setConnectOpen} />
        </Layer>
      )}

      {account && settingsOpen && (
        <Layer onClickOutside={() => setSettingsOpen(false)} onEsc={() => setSettingsOpen(false)}>
          <YieldSettings setConnectOpen={setConnectOpen} setSettingsOpen={setSettingsOpen} />
        </Layer>
      )}

      {account ? (
        <Box direction="row" gap="xsmall" align="center">
          {!mobile && <>{processPending ? <TransactionWidget /> : <YieldBalances />}</>}
          <Box round="xsmall" onClick={() => setSettingsOpen(true)} pad="small" justify="center">
            {mobile ? (
              <Text color="text">
                <FiSettings />
              </Text>
            ) : (
              <Box direction="row" align="center" gap="small">
                <Box>
                  <Text color="text" size="small">
                    {abbreviateHash(account)}
                  </Text>

                  <Box direction="row" align="center" gap="small">
                    <Box direction="row" gap="small" align="center">
                      <StyledText size="small" color="text">
                      <EthMark /> {ethBalance} 
                      </StyledText>
                    </Box>
                    {/* <FiCircle fill={chainData.color} color={chainData.color} size=".5rem" />
                  <Text size="xsmall" color={chainData.color} alignSelf="end">
                    {chainData.name}
                  </Text> */}
                  </Box>
                </Box>
                <Box>
                  <YieldAvatar address={account} size={2} />
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <ConnectButton action={() => setConnectOpen(true)} />
      )}
    </>
  );
};

export default YieldAccount;

import React, { useState, useContext } from 'react';
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

const YieldAccount = (props: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    chainState: { account, chainData },
  } = useContext(ChainContext);

  const {
    txState: { sigPending, txPending, processPending },
  } = useContext(TxContext);

  const [settingsOpen, setSettingsOpen] = useState<boolean>();
  const [connectOpen, setConnectOpen] = useState<boolean>();

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

                  <Box direction='row' align='center' gap='small'>          
                  <FiCircle fill={chainData.color} color={chainData.color} size=".5rem" />
                  <Text size="xsmall" color={chainData.color} alignSelf="end">
                    {chainData.name}
                  </Text>
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
        <Box border={!mobile} onClick={() => setConnectOpen(true)} pad="small">
          <Text size="small" color="text">
            {mobile ? <FiMenu /> : 'Connect Wallet'}
          </Text>
        </Box>
      )}
    </>
  );
};

export default YieldAccount;

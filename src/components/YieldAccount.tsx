import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { Text, Box, ResponsiveContext } from 'grommet';
import { FiSettings } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';

import YieldBalances from './YieldBalances';

import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';

import { abbreviateHash } from '../utils/appUtils';
import YieldAvatar from './YieldAvatar';
import TransactionWidget from './TransactionWidget';
import ConnectButton from './buttons/ConnectButton';
import SidebarSettings from './SidebarSettings';
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
    chainState: { account },
  } = useContext(ChainContext);

  const {
    userState: { assetMap, assetsLoading },
  } = useContext(UserContext);

  const {
    txState: { sigPending, txPending, processPending, processActive },
  } = useContext(TxContext);

  const [settingsOpen, setSettingsOpen] = useState<boolean>();
  const [connectOpen, setConnectOpen] = useState<boolean>();

  const ethBalance = assetMap.get(WETH)?.balance_;

  return (
    <>
      <SidebarSettings
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        connectOpen={connectOpen}
        setConnectOpen={setConnectOpen}
      />

      {account ? (
        <Box direction="row" gap="xsmall" align="center">
          {!mobile && <>{processActive ? <TransactionWidget /> : <YieldBalances />}</>}
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
                        <EthMark /> {assetsLoading ? <Skeleton width={40} /> : ethBalance}
                      </StyledText>
                    </Box>
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

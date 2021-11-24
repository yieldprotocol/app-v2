import React, { useContext, useState } from 'react';
import { Anchor, Box, Collapsible, ResponsiveContext, Text, Tip } from 'grommet';
import { FiChevronUp, FiChevronDown, FiExternalLink, FiX } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';
import { abbreviateHash, clearCachedItems } from '../utils/appUtils';
import YieldAvatar from './YieldAvatar';
import { TxContext } from '../contexts/TxContext';
import CopyWrap from './wraps/CopyWrap';
import TransactionItem from './TransactionItem';
import { useEns } from '../hooks/useEns';
import BoxWrap from './wraps/BoxWrap';
import SlippageSetting from './settings/SlippageSetting';
import ApprovalSetting from './settings/ApprovalSetting';
import ThemeSetting from './settings/ThemeSetting';
import GeneralButton from './buttons/GeneralButton';

const YieldSettings = ({ setSettingsOpen, setConnectOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    chainState: {
      connection: { account, CONNECTOR_INFO, currentChainInfo, connectionName },
    },
    chainActions: { disconnect },
  } = useContext(ChainContext);
  const {
    txState: { transactions },
  } = useContext(TxContext);

  const { ensName } = useEns();

  const [transactionsOpen, setTransactionsOpen] = useState<boolean>(false);
  const [connectionSettingsOpen, setConnectionSettingsOpen] = useState<boolean>(false);

  const handleChangeConnectType = () => {
    setSettingsOpen(false);
    setConnectOpen(true);
  };

  const handleResetApp = () => {
    clearCachedItems([]);
    // eslint-disable-next-line no-restricted-globals
    location.reload();
  };

  return (
    <Box
      fill
      width={mobile ? undefined : '400px'}
      background="lightBackground"
      elevation="xlarge"
      justify="between"
      style={{ overflow: 'auto' }}
    >
      <Box gap="small" pad="medium" background="gradient-transparent" flex={false}>
        <Box alignSelf="end" onClick={() => setSettingsOpen(false)} pad="small">
          <FiX size="1.5rem" />
        </Box>

        {!mobile && (
          <Box gap="small" style={{ position: 'fixed' }} margin={{ left: '-60px', top: '10%' }} animation="slideLeft">
            <YieldAvatar address={account} size={7} />
          </Box>
        )}

        <Box align="end">
          <Box direction="row" gap="small" fill align="center" justify={mobile ? 'between' : 'end'}>
            {mobile && <YieldAvatar address={account} size={2} />}
            <CopyWrap hash={account}>
              <Text size={mobile ? 'medium' : 'xlarge'}>{ensName || abbreviateHash(account, 6)}</Text>
            </CopyWrap>
          </Box>

          {!mobile && (
            <Box align="center" direction="row" gap="small" justify="center">
              {currentChainInfo?.name && (
                <Anchor
                  href={`https://${
                    currentChainInfo.name === 'Mainnet' ? '' : `${currentChainInfo.name}.`
                  }etherscan.io/address/${account}`}
                  margin="xsmall"
                  target="_blank"
                >
                  <FiExternalLink size="1rem" style={{ verticalAlign: 'middle' }} />
                  <Text margin="xxsmall" size="xsmall">
                    View on Explorer
                  </Text>
                </Anchor>
              )}
            </Box>
          )}
        </Box>

        <Box gap="medium">
          <Box
            direction="row"
            justify="end"
            onClick={() => setConnectionSettingsOpen(!connectionSettingsOpen)}
            gap="medium"
            margin={{ top: 'large' }}
          >
            <BoxWrap direction="row" gap="small">
              {connectionName && (
                <Text size="xsmall">Connected with {CONNECTOR_INFO.get(connectionName).displayName}</Text>
              )}
              {connectionSettingsOpen ? <FiChevronUp /> : <FiChevronDown />}
            </BoxWrap>
          </Box>

          <Collapsible open={connectionSettingsOpen}>
            <Box gap="xsmall">
              <GeneralButton action={handleChangeConnectType} background="gradient-transparent">
                <Text size="xsmall"> Change Connection</Text>
              </GeneralButton>

              <GeneralButton action={() => disconnect()} background="gradient-transparent">
                <Text size="xsmall"> Disconnect </Text>
              </GeneralButton>
            </Box>
          </Collapsible>
        </Box>
      </Box>

      <Box pad="medium" gap="medium" flex={false}>
        <ThemeSetting />
        <ApprovalSetting />
        <SlippageSetting />
      </Box>

      <Box pad="medium" gap="small" flex={false}>
        <Text size="small"> Troubleshooting </Text>
        <GeneralButton action={handleResetApp} background="background">
          <Tip
            content={<Text size="xsmall">Having issues? Try resetting the app.</Text>}
            dropProps={{
              align: { right: 'left' },
            }}
          >
            <Text size="xsmall"> Reset App </Text>
          </Tip>
        </GeneralButton>
      </Box>

      <Box
        margin={{ top: 'auto' }}
        pad="medium"
        gap="small"
        background="gradient-transparent"
        round={{ size: 'xsmall', corner: 'top' }}
        flex={false}
      >
        <Box align="center" direction="row" justify="between" onClick={() => setTransactionsOpen(!transactionsOpen)}>
          <Text size="small">Recent Transactions</Text>
          {transactionsOpen ? <FiChevronDown size="1.25rem" /> : <FiChevronUp size="1.25rem" />}
        </Box>

        <Collapsible open={transactionsOpen}>
          {!transactions.size && <Text size="xsmall">Your transactions will appear here...</Text>}
          <Box>
            {[...transactions.values()].map((tx: any) => (
              <TransactionItem tx={tx} key={tx.tx.hash} wide={true} />
            ))}
          </Box>
        </Collapsible>
      </Box>
    </Box>
  );
};

export default YieldSettings;

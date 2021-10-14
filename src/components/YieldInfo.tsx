import { Anchor, Box, Collapsible, ResponsiveContext, Text } from 'grommet';
import { useLocation } from 'react-router-dom';

import React, { useContext, useEffect, useState } from 'react';
import {
  FiMenu,
  FiGithub as Github,
  FiBookOpen as Docs,
  FiSun as Sun,
  FiMoon as Moon,
  FiClock as Clock,
  FiFileText as Terms,
} from 'react-icons/fi';
import { FaDiscord as Discord } from 'react-icons/fa';

import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
import BoxWrap from './wraps/BoxWrap';

const IconSize = '1.15rem';
const IconGap = 'small';

const YieldInfo = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    chainState: { account, chainId, chainData, appVersion },
    chainActions: { connect, disconnect },
  } = useContext(ChainContext);
  const {
    txState: { txPending, signPending, processPending },
  } = useContext(TxContext);

  const { pathname } = useLocation();
  const [path, setPath] = useState<string>();
  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    pathname && setPath(pathname.split('/')[1]);
  }, [pathname]);

  const {
    userState: { assetMap, selectedBaseId, selectedIlkId },
  } = useContext(UserContext);

  const selectedBase = assetMap.get(selectedBaseId);
  const selectedIlk = assetMap.get(selectedIlkId);

  const handleExternal = (destination: string) => {
    // analyticsLogEvent('external_link', {
    //   action: destination
    // });
  };

  return (
    <Box gap="small">
      <Box>
        <Text size="xsmall" color="grey">
          App version: v{appVersion}
        </Text>
        {/* <Text size="xsmall" color="grey"> Having issues? Try an app <Anchor onClick={() => resetApp()}>RESET</Anchor>, or get hold of us via <Anchor href="https://discord.gg/JAFfDj5" target="_blank" onClick={() => handleExternal('Discord')}>discord</Anchor>. </Text> */}
      </Box>

      <Box direction="row" gap={IconGap}>
        <BoxWrap>
          <Anchor
            color="grey"
            href="https://github.com/yieldprotocol"
            target="_blank"
            onClick={() => handleExternal('Github')}
          >
            <Github size={IconSize} />
          </Anchor>
        </BoxWrap>

        <BoxWrap>
          <Anchor color="grey" href="http://docs.yield.is" target="_blank" onClick={() => handleExternal('Docs')}>
            <Docs size={IconSize} />
          </Anchor>
        </BoxWrap>

        <BoxWrap>
          <Anchor
            color="grey"
            href="https://discord.gg/JAFfDj5"
            target="_blank"
            onClick={() => handleExternal('Discord')}
          >
            <Discord size={IconSize} />
          </Anchor>
        </BoxWrap>

        <BoxWrap>
          <Anchor color="grey" href="/terms" target="_blank" onClick={() => handleExternal('Terms')}>
            <Terms size={IconSize} />
          </Anchor>
        </BoxWrap>
      </Box>

      {account ? (
        <Box direction="row-responsive" gap="small">
          <Text size="xsmall">
            {`Connected to: `}
            <Text size="xsmall" color={chainData.color}>
              {chainData.name}
            </Text>
          </Text>
          <Box onClick={() => disconnect()}>
            <Text size="xsmall" color="text-xweak">
              Disconnect
            </Text>
          </Box>
        </Box>
      ) : (
        <Box direction="row-responsive" gap="small">
          <Text size="xsmall" color="pink">
            Disconnected
          </Text>
          <Box onClick={() => connect()}>
            <Text size="xsmall" color={account ? 'text-xweak' : 'text-weak'}>
              Connect
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default YieldInfo;

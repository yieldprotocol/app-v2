import { Anchor, Box, ResponsiveContext, Text } from 'grommet';
import { useLocation } from 'react-router-dom';

import React, { useContext, useEffect, useState } from 'react';
import { FiGithub as Github, FiBookOpen as Docs, FiFileText as Terms, FiKey as Privacy } from 'react-icons/fi';
import { FaDiscord as Discord } from 'react-icons/fa';

import { ChainContext } from '../contexts/ChainContext';
import BoxWrap from './wraps/BoxWrap';

const IconSize = '1.15rem';
const IconGap = 'small';

const YieldInfo = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    chainState: {
      connection: { account, CHAIN_INFO, fallbackChainId },
      appVersion,
    },
    chainActions: { connect, disconnect },
  } = useContext(ChainContext);

  const { pathname } = useLocation();
  const [path, setPath] = useState<string>();
  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    pathname && setPath(pathname.split('/')[1]);
  }, [pathname]);

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
          <Anchor
            color="grey"
            href="https://yieldprotocol.com/terms/"
            target="_blank"
            onClick={() => handleExternal('Terms')}
          >
            <Terms size={IconSize} />
          </Anchor>
        </BoxWrap>

        <BoxWrap>
          <Anchor
            color="grey"
            href="https://yieldprotocol.com/privacy/"
            target="_blank"
            onClick={() => handleExternal('Privacy')}
          >
            <Privacy size={IconSize} />
          </Anchor>
        </BoxWrap>
      </Box>

      {account ? (
        <Box direction="row-responsive" gap="small">
          <Text size="xsmall">
            {`Connected to: `}
            <Text size="xsmall" color={CHAIN_INFO.get(fallbackChainId)?.color}>
              {CHAIN_INFO.get(fallbackChainId)?.name}
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

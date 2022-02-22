import React, { useContext } from 'react';
import { Anchor, Box, Text } from 'grommet';

import { FiGithub as Github, FiBookOpen as Docs, FiFileText as Terms, FiKey as Privacy } from 'react-icons/fi';
import { FaDiscord as Discord } from 'react-icons/fa';

import { ChainContext } from '../contexts/ChainContext';
import BoxWrap from './wraps/BoxWrap';
import { useBlockNum } from '../hooks/useBlockNum';
import NetworkSelector from './selectors/NetworkSelector';
import { IChainContext } from '../types';
import { CHAIN_INFO } from '../config/chainData';

const IconSize = '1.15rem';
const IconGap = 'small';

const YieldInfo = () => {
  const {
    chainState: {
      connection: { fallbackChainId },
      appVersion,
    },
  } = useContext(ChainContext) as IChainContext;

  const connectedChain = CHAIN_INFO.get(fallbackChainId!);
  const blockNum = useBlockNum();
  const handleExternal = (destination: string) => {
    // analyticsLogEvent('external_link', {
    //   action: destination
    // });
  };

  return (
    <Box gap="small" align='end'>


  
      <Box alignSelf='end'>
        <Text size="xsmall" color="text-weak">
          App version: v{appVersion}
        </Text>
      </Box>

      <Box direction="row" gap={IconGap}>
        <BoxWrap>
          <Anchor
            color="text-weak"
            href="https://github.com/yieldprotocol"
            target="_blank"
            onClick={() => handleExternal('Github')}
          >
            <Github size={IconSize} />
          </Anchor>
        </BoxWrap>

        <BoxWrap>
          <Anchor
            color="text-weak"
            href="http://docs.yieldprotocol.com"
            target="_blank"
            onClick={() => handleExternal('Docs')}
          >
            <Docs size={IconSize} />
          </Anchor>
        </BoxWrap>

        <BoxWrap>
          <Anchor
            color="text-weak"
            href="https://discord.gg/JAFfDj5"
            target="_blank"
            onClick={() => handleExternal('Discord')}
          >
            <Discord size={IconSize} />
          </Anchor>
        </BoxWrap>

        <BoxWrap>
          <Anchor
            color="text-weak"
            href="https://yieldprotocol.com/terms/"
            target="_blank"
            onClick={() => handleExternal('Terms')}
          >
            <Terms size={IconSize} />
          </Anchor>
        </BoxWrap>

        <BoxWrap>
          <Anchor
            color="text-weak"
            href="https://yieldprotocol.com/privacy/"
            target="_blank"
            onClick={() => handleExternal('Privacy')}
          >
            <Privacy size={IconSize} />
          </Anchor>
        </BoxWrap>
      </Box>

      {connectedChain && (
        <Box direction="row" gap="xsmall" align="center" flex elevation='xsmall' pad='xsmall' round={{'corner':'left' }}  >
          <NetworkSelector />
          {/* {blockNum && connectedChain.explorer && !connectedChain.name.includes('Optimism') && (
            <Anchor style={{ lineHeight: '0' }} href={`${connectedChain.explorer}/block/${blockNum}`} target="_blank">
              <Text size="xsmall" color={connectedChain.colorSecondary || connectedChain.color}>
                {blockNum}
              </Text>
            </Anchor>
          )} */}
        </Box>
      )}


    </Box>
  );
};

export default YieldInfo;

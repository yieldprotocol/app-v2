import { useContext } from 'react';
import { Anchor, Box, Text } from 'grommet';

import { FiGithub as Github, FiBookOpen as Docs, FiFileText as Terms, FiKey as Privacy } from 'react-icons/fi';
import { FaDiscord as Discord } from 'react-icons/fa';

import { useNetwork } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import BoxWrap from './wraps/BoxWrap';
import { IChainContext } from '../types';
import NetworkSelector from './selectors/NetworkSelector';

const IconSize = '1.15rem';
const IconGap = 'small';

const YieldInfo = () => {
  const { activeChain } = useNetwork();

  const {
    chainState: { appVersion },
  } = useContext(ChainContext) as IChainContext;

  const handleExternal = (destination: string) => {};

  return (
    <Box gap="small" align="end" style={{ position: 'absolute', bottom: '3em', right: '3em' }}>
      <Box alignSelf="end">
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
      {activeChain && (
        <Box align="end" gap="xsmall">
          <Box gap="xsmall" justify="end" flex elevation="xsmall" pad="xsmall" round>
            <NetworkSelector />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default YieldInfo;

import { Anchor, Box, Text } from 'grommet';

import React, { useContext, } from 'react';
import { FiGithub as Github, FiBookOpen as Docs, FiFileText as Terms, FiKey as Privacy } from 'react-icons/fi';
import { FaDiscord as Discord } from 'react-icons/fa';

import { ChainContext } from '../contexts/ChainContext';
import BoxWrap from './wraps/BoxWrap';
import { useBlockNum } from '../hooks/useBlockNum';

const IconSize = '1.15rem';
const IconGap = 'small';

const YieldInfo = () => {

  const {
    chainState: {
      connection: { CHAIN_INFO, fallbackChainId, currentChainInfo },
      appVersion,
    },
  } = useContext(ChainContext);

  const connectedChain = CHAIN_INFO?.get(fallbackChainId!);

  const { pathname } = useLocation();
  const blockNum = useBlockNum();
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
          <Anchor
            color="grey"
            href="http://docs.yieldprotocol.com"
            target="_blank"
            onClick={() => handleExternal('Docs')}
          >
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

      {connectedChain && (
        <Box direction="row" gap="xsmall" align="center" flex>
          <Text size="xsmall" color={CHAIN_INFO.get(fallbackChainId)?.color}>
            {CHAIN_INFO.get(fallbackChainId)?.name}
          </Text>
          {blockNum && currentChainInfo?.name && (
            <Anchor
              style={{ lineHeight: '0' }}
              href={`https://${
                currentChainInfo.name === 'Mainnet' ? '' : `${currentChainInfo.name}.`
              }etherscan.io/block/${blockNum}`}
              target="_blank"
            >
              <Text size="xsmall" color={CHAIN_INFO.get(fallbackChainId)?.color}>
                {blockNum}
              </Text>
            </Anchor>
          )}
        </Box>
      )}
    </Box>
  );
};

export default YieldInfo;

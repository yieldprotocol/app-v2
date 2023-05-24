import { useContext } from 'react';
import { Anchor, Box, Text, Tip } from 'grommet';

import {
  FiGithub as Github,
  FiBookOpen as Docs,
  FiFileText as Terms,
  FiKey as Privacy,
  FiDownload,
} from 'react-icons/fi';
import { FaDiscord as Discord } from 'react-icons/fa';

import { ChainContext } from '../contexts/ChainContext';
import BoxWrap from './wraps/BoxWrap';
import NetworkSelector from './selectors/NetworkSelector';
import PublicNotification from './PublicNotification';

const IconSize = '1.15rem';
const IconGap = 'small';

const FooterInfo = () => {
  const {
    chainActions: { exportContractAddresses },
  } = useContext(ChainContext);

  const handleExternal = (destination: string) => {};

  return (
    <>
      <Box gap="small" align="end" width="20%" style={{ position: 'absolute', bottom: '3em', right: '3em' }}>
        <Box alignSelf="end" width="225px">
          <PublicNotification />{' '}
        </Box>
        <Box alignSelf="end">
          <Text size="xsmall" color="text-weak">
            App version: v{process.env.REACT_APP_VERSION}
          </Text>
        </Box>
        <Box direction="row" gap={IconGap}>
          <BoxWrap>
            <Tip content={<Text size="small">Github</Text>}>
              <Anchor
                color="text-weak"
                href="https://github.com/yieldprotocol"
                target="_blank"
                onClick={() => handleExternal('Github')}
              >
                <Github size={IconSize} />
              </Anchor>
            </Tip>
          </BoxWrap>

          <BoxWrap>
            <Tip content={<Text size="small">Docs</Text>}>
              <Anchor
                color="text-weak"
                href="http://docs.yieldprotocol.com"
                target="_blank"
                onClick={() => handleExternal('Docs')}
              >
                <Docs size={IconSize} />
              </Anchor>
            </Tip>
          </BoxWrap>

          <BoxWrap>
            <Tip content={<Text size="small">Discord</Text>}>
              <Anchor
                color="text-weak"
                href="https://discord.gg/JAFfDj5"
                target="_blank"
                onClick={() => handleExternal('Discord')}
              >
                <Discord size={IconSize} />
              </Anchor>
            </Tip>
          </BoxWrap>

          <BoxWrap>
            <Tip content={<Text size="small">Ts&Cs</Text>}>
              <Anchor
                color="text-weak"
                href="https://yieldprotocol.com/terms/"
                target="_blank"
                onClick={() => handleExternal('Terms')}
              >
                <Terms size={IconSize} />
              </Anchor>
            </Tip>
          </BoxWrap>

          <BoxWrap>
            <Tip content={<Text size="small">Privacy</Text>}>
              <Anchor
                color="text-weak"
                href="https://yieldprotocol.com/privacy/"
                target="_blank"
                onClick={() => handleExternal('Privacy')}
              >
                <Privacy size={IconSize} />
              </Anchor>
            </Tip>
          </BoxWrap>

          <BoxWrap>
            <Tip content={<Text size="small">Export Contract Addresses</Text>}>
              <Anchor color="text-weak" target="_blank" onClick={() =>console.log('addresses not available') }>
                <FiDownload size={IconSize} />
              </Anchor>
            </Tip>
          </BoxWrap>
        </Box>

        <NetworkSelector />
      </Box>
    </>
  );
};

export default FooterInfo;

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
import { IChainContext } from '../types';
import { useNetwork } from 'wagmi';

const IconSize = '1.15rem';
const IconGap = 'small';

const FooterInfo = () => {

  const {
    chainActions: { exportContractAddresses },
  } = useContext(ChainContext) as IChainContext;

  const {chain} = useNetwork();
  const handleExternal = (destination: string) => {};

  return (
    <Box gap="small" align="end" style={{ position: 'absolute', bottom: '3em', right: '3em' }}>
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
            <Anchor color="text-weak" target="_blank" onClick={() => exportContractAddresses()}>
              <FiDownload size={IconSize} />
            </Anchor>
          </Tip>
        </BoxWrap>
      </Box>

      <Text size='xsmall'>{ chain ? 'Connected to: ': 'Viewing network: ' } <NetworkSelector /> </Text> 

      {/* <Box align='center'>
        <Text size="xsmall"> NOTICE:</Text>
        <Text size="xsmall"> We are aware of a few UI issues, in particular related to the December pools. </Text>
        <Text size="xsmall"> If you are having any difficulties, please check back shortly.</Text>
      </Box> */}
    </Box>
  );
};

export default FooterInfo;

import { Text } from 'grommet';
import { useNetwork } from 'wagmi';
import { useChainModal, useConnectModal } from '@rainbow-me/rainbowkit';

const NetworkSelector = () => {
  const { chain, chains } = useNetwork();
  const { openChainModal } = useChainModal();
  const { openConnectModal } = useConnectModal();

  return chain ? (
    <Text size="xsmall" onClick={openChainModal}>
      {chain.name}
    </Text>
  ) : chains.length ? (
    <Text size="xsmall" onClick={openConnectModal}>
      {chains[0].name}
    </Text>
  ) : null;
};

export default NetworkSelector;

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
  ) : (
    <Text size="xsmall" onClick={openConnectModal}>
      {chains[0].name}
    </Text>
  );
};

export default NetworkSelector;

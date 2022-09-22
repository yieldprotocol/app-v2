import { Text } from 'grommet';
import { useNetwork, useProvider } from 'wagmi';
import { useChainModal, useConnectModal } from '@rainbow-me/rainbowkit';

const NetworkSelector = () => {
  const { chain } = useNetwork();
  const provider = useProvider();
  const { openChainModal } = useChainModal();
  const { openConnectModal } = useConnectModal();

  return chain ? (
    <Text size="xsmall" onClick={openChainModal}>
      {chain.name}
    </Text>
  ) : (
    <Text size="xsmall" onClick={openConnectModal}>
      {provider.chains![0].name}
    </Text>
  );
};

export default NetworkSelector;

import { Text } from 'grommet';
import { useAccount, useNetwork } from 'wagmi';
import { useChainModal, useConnectModal } from '@rainbow-me/rainbowkit';
import GeneralButton from '../buttons/GeneralButton';
import { PropsWithChildren } from 'react';

const NetworkSelector = (props: PropsWithChildren) => {
  const { address: account } = useAccount();
  const { chain, chains } = useNetwork();
  const { openChainModal } = useChainModal();
  const { openConnectModal } = useConnectModal();

  return account && chain ? (
    <GeneralButton action={openChainModal} {...props}>
      <Text size="small" onClick={openChainModal}>
        {chain.name}
      </Text>
    </GeneralButton>
  ) : (
    <GeneralButton action={openConnectModal} {...props}>
      <Text size="small" onClick={openConnectModal}>
        {chains[0].name}
      </Text>
    </GeneralButton>
  );
};

export default NetworkSelector;

import { Box, Text } from 'grommet';
import { useAccount, useNetwork } from 'wagmi';
import { useChainModal, useConnectModal, ConnectButton as Connect } from '@rainbow-me/rainbowkit';
import GeneralButton from '../buttons/GeneralButton';
import { ComponentPropsWithoutRef } from 'react';
import Image from 'next/image';

interface Props extends ComponentPropsWithoutRef<typeof GeneralButton> {}

const ConnectButton = (props: Props) => {
  return (
    <Connect.Custom>
      {({ account, chain, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <div>
            {(() => {
              if (!connected) {
                return (
                  <GeneralButton action={openConnectModal} {...props}>
                    Connect Wallet
                  </GeneralButton>
                );
              }

              if (chain.unsupported) {
                return (
                  <GeneralButton action={openChainModal} {...props}>
                    Wrong network
                  </GeneralButton>
                );
              }

              return (
                <GeneralButton action={openChainModal} {...props}>
                  <Box direction="row" gap="small">
                    {chain.iconUrl && (
                      <Image alt={chain.name ?? 'Chain icon'} src={chain.iconUrl} width={20} height={20} />
                    )}
                    <Text size="small">{chain.name}</Text>
                  </Box>
                </GeneralButton>
              );
            })()}
          </div>
        );
      }}
    </Connect.Custom>
  );
};

const NetworkSelector = (props: Props) => <ConnectButton {...props} />;

export default NetworkSelector;

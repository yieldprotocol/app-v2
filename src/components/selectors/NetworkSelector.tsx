import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Box } from 'grommet';
import Image from 'next/image';

const NetworkSelector = () => (
  <ConnectButton.Custom>
    {({ account, chain, openChainModal, openConnectModal, mounted }) => (
      <div
        {...(!mounted && {
          'aria-hidden': true,
          style: {
            opacity: 0,
            pointerEvents: 'none',
            userSelect: 'none',
          },
        })}
      >
        {(() => {
          if (!mounted || !account || !chain) {
            return null;
          }

          if (chain.unsupported) {
            return (
              <button onClick={openChainModal} type="button">
                Wrong network
              </button>
            );
          }

          return (
            <Box
              onClick={openChainModal}
              round
              direction="row"
              gap="xsmall"
              align="center"
              elevation="xsmall"
              pad="xsmall"
            >
              {chain.iconUrl && <Image alt={chain.name ?? 'Chain icon'} src={chain.iconUrl} height={20} width={20} />}
              {chain.name}
            </Box>
          );
        })()}
      </div>
    )}
  </ConnectButton.Custom>
);

export default NetworkSelector;

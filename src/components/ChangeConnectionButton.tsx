import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Text } from 'grommet';
import GeneralButton from './buttons/GeneralButton';

const ChangeConnectionButton = ({ setSettingsOpen }: { setSettingsOpen: (isOpen: boolean) => void }) => (
  <ConnectButton.Custom>
    {({ account, chain, openConnectModal, mounted, openChainModal, openAccountModal }) => (
      <>
        {(() => (
          <GeneralButton
            action={() => {
              openConnectModal();
            }}
            background="gradient-transparent"
          >
            <Text size="xsmall">Change Connection</Text>
          </GeneralButton>
        ))()}
      </>
    )}
  </ConnectButton.Custom>
);

export default ChangeConnectionButton;

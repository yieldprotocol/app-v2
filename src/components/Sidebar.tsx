import { useContext } from 'react';
import { Layer, ResponsiveContext } from 'grommet';
import SidebarSettings from './SidebarSettings';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Sidebar = ({ settingsOpen, setSettingsOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <ConnectButton.Custom>
    {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
      // Note: If your app doesn't use authentication, you
      const connected = mounted && account && chain;
            return connected && settingsOpen ? (
              <Layer
              modal={false}
              responsive={true}
              full="vertical"
              position="right"
              style={mobile ? { minWidth: undefined, maxWidth: undefined } : { minWidth: '400px', maxWidth: '400px' }}
              onClickOutside={() => setSettingsOpen(false)}
              onEsc={() => setSettingsOpen(false)}
            >
              <SidebarSettings setConnectOpen={openConnectModal()} setSettingsOpen={setSettingsOpen} />
            </Layer>
            ) : <div />;
          }}
        </ConnectButton.Custom>
  );
};

export default Sidebar;

import { useContext } from 'react';
import { Layer, ResponsiveContext } from 'grommet';
import SidebarSettings from './SidebarSettings';
import { ConnectKitButton } from 'connectkit';

const Sidebar = ({ settingsOpen, setSettingsOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
      <ConnectKitButton.Custom>
          {({ isConnected, show }) => {
            return isConnected && settingsOpen ? (
              <Layer
              modal={false}
              responsive={true}
              full="vertical"
              position="right"
              style={mobile ? { minWidth: undefined, maxWidth: undefined } : { minWidth: '400px', maxWidth: '400px' }}
              onClickOutside={() => setSettingsOpen(false)}
              onEsc={() => setSettingsOpen(false)}
            >
              <SidebarSettings setConnectOpen={show} setSettingsOpen={setSettingsOpen} />
            </Layer>
            ) : <div />;
          }}
        </ConnectKitButton.Custom>
  );
};

export default Sidebar;

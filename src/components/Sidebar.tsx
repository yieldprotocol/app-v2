import { useContext } from 'react';
import { Layer, ResponsiveContext } from 'grommet';
import SidebarSettings from './SidebarSettings';
import SidebarConnect from './SidebarConnect';
import { useAccount } from 'wagmi';

const Sidebar = ({ settingsOpen, setSettingsOpen, connectOpen, setConnectOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {isConnected} = useAccount();

  return (
    <>
      {connectOpen && (
        <Layer
          modal={false}
          responsive={true}
          full={mobile}
          position="top-right"
          margin={mobile ? undefined : 'small'}
          style={mobile ? { minWidth: undefined, maxWidth: undefined } : { minWidth: '400px', maxWidth: '400px' }}
          onClickOutside={() => setConnectOpen(false)}
          background="lightBackground"
          onEsc={() => setConnectOpen(false)}
        >
          <SidebarConnect setConnectOpen={setConnectOpen} setSettingsOpen={setSettingsOpen} />
        </Layer>
      )}

      {isConnected && settingsOpen && (
        <Layer
          modal={false}
          responsive={true}
          full="vertical"
          position="right"
          style={mobile ? { minWidth: undefined, maxWidth: undefined } : { minWidth: '400px', maxWidth: '400px' }}
          onClickOutside={() => setSettingsOpen(false)}
          onEsc={() => setConnectOpen(false)}
        >
          <SidebarSettings setConnectOpen={setConnectOpen} setSettingsOpen={setSettingsOpen} />
        </Layer>
      )}
    </>
  );
};

export default Sidebar;

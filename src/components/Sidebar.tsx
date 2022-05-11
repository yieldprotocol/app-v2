import { useContext } from 'react';
import { Layer, ResponsiveContext } from 'grommet';
import { useAccount } from 'wagmi';
import YieldSettings from './YieldSettings';
import Connect from './Connect';

const Sidebar = ({ settingsOpen, setSettingsOpen, connectOpen, setConnectOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    data: { address: account },
  } = useAccount();

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
          <Connect setConnectOpen={setConnectOpen} setSettingsOpen={setSettingsOpen} />
        </Layer>
      )}

      {account && settingsOpen && (
        <Layer
          modal={false}
          responsive={true}
          full="vertical"
          position="right"
          style={mobile ? { minWidth: undefined, maxWidth: undefined } : { minWidth: '400px', maxWidth: '400px' }}
          onClickOutside={() => setSettingsOpen(false)}
          onEsc={() => setConnectOpen(false)}
        >
          <YieldSettings setConnectOpen={setConnectOpen} setSettingsOpen={setSettingsOpen} />
        </Layer>
      )}
    </>
  );
};

export default Sidebar;

import { useContext } from 'react';
import { Layer, ResponsiveContext } from 'grommet';
import { useAccount } from 'wagmi';
import YieldSettings from './YieldSettings';

const Sidebar = ({ settingsOpen, setSettingsOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const { data: _account } = useAccount();
  const account = _account?.address;

  return (
    <>
      {account && settingsOpen && (
        <Layer
          modal={false}
          responsive={true}
          full="vertical"
          position="right"
          style={mobile ? { minWidth: undefined, maxWidth: undefined } : { minWidth: '400px', maxWidth: '400px' }}
          onClickOutside={() => setSettingsOpen(false)}
        >
          <YieldSettings setSettingsOpen={setSettingsOpen} />
        </Layer>
      )}
    </>
  );
};

export default Sidebar;

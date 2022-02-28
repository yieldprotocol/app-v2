import React, { useContext } from 'react';
import { Layer, ResponsiveContext } from 'grommet';
import { ChainContext } from '../contexts/ChainContext';
import YieldSettings from './YieldSettings';
import Connect from './Connect';

const Sidebar = ({ settingsOpen, setSettingsOpen, connectOpen, setConnectOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    chainState: {
      connection: { account },
    },
  } = useContext(ChainContext);

  return (
    <>
      {connectOpen && (
        <Layer
          modal={false}
          responsive={true}
          position="top-right"
          margin='small'
          style={mobile ? { minWidth: undefined, maxWidth: undefined } : { minWidth: '400px', maxWidth: '400px' }}
          onClickOutside={() => setConnectOpen(false)}
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
        >
          <YieldSettings setConnectOpen={setConnectOpen} setSettingsOpen={setSettingsOpen} />
        </Layer>
      )}
    </>
  );
};

export default Sidebar;

import React, { useContext } from 'react';
import styled from 'styled-components';
import { Layer, ResponsiveContext } from 'grommet';
import { ChainContext } from '../contexts/ChainContext';
import YieldSettings from './YieldSettings';
import Connect from './Connect';

const SidebarSettings = ({ settingsOpen, setSettingsOpen, connectOpen, setConnectOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    chainState: { account },
  } = useContext(ChainContext);

  return (
    <>
      {connectOpen && (
        <Layer
          modal={false}
          responsive={true}
          full="vertical"
          position="right"
          style={mobile ? { minWidth: undefined, maxWidth: undefined } : { minWidth: '400px', maxWidth: '400px' }}
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
        >
          <YieldSettings setConnectOpen={setConnectOpen} setSettingsOpen={setSettingsOpen} />
        </Layer>
      )}
    </>
  );
};

export default SidebarSettings;

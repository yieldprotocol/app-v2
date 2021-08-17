import React, { useContext } from 'react';
import styled from 'styled-components';
import { Layer } from 'grommet';
import { ChainContext } from '../contexts/ChainContext';
import YieldSettings from './YieldSettings';
import Connect from './Connect';

const SidebarSettings = ({ settingsOpen, setSettingsOpen, connectOpen, setConnectOpen }: any) => {
  const {
    chainState: { account },
  } = useContext(ChainContext);

  return (
    <>
      {connectOpen && (
        <Layer modal={false} responsive={true} full="vertical" position="right">
          <Connect setConnectOpen={setConnectOpen} setSettingsOpen={setSettingsOpen} />
        </Layer>
      )}

      {account && settingsOpen && (
        <Layer modal={false} responsive={true} full="vertical" position="right">
          <YieldSettings setConnectOpen={setConnectOpen} setSettingsOpen={setSettingsOpen} />
        </Layer>
      )}
    </>
  );
};

export default SidebarSettings;

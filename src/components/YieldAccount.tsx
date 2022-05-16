import { useState, useContext } from 'react';
import { Box, ResponsiveContext } from 'grommet';
import { useAccount } from 'wagmi';
import SidebarSettings from './Sidebar';
import SettingsBalances from './SettingsBalances';
import RainbowConnectButton from './RainbowConnectButton';

const YieldAccount = (props: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const { data: _account } = useAccount();
  const account = _account?.address;

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  return (
    <>
      <SidebarSettings settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} />

      <Box direction="row" gap="xsmall" align="center">
        {!mobile && account && <SettingsBalances />}
        <RainbowConnectButton setSettingsOpen={setSettingsOpen} />
      </Box>
    </>
  );
};

export default YieldAccount;

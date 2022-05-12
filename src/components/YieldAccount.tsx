import { useState, useContext } from 'react';
import styled from 'styled-components';
import { Text, Box, ResponsiveContext } from 'grommet';
import { FiSettings } from 'react-icons/fi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useEnsName } from 'wagmi';
import Skeleton from './wraps/SkeletonWrap';
import { ChainContext } from '../contexts/ChainContext';
import { abbreviateHash } from '../utils/appUtils';
import YieldAvatar from './YieldAvatar';
import SidebarSettings from './Sidebar';
import EthMark from './logos/EthMark';
import { UserContext } from '../contexts/UserContext';
import { WETH } from '../config/assets';
import SettingsBalances from './SettingsBalances';

const StyledText = styled(Text)`
  svg,
  span {
    vertical-align: middle;
  }
`;

const StyledBox = styled(Box)`
  text-decoration: none;
  padding: 8px;
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.1);
  }
`;

const YieldAccount = (props: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    userState: { assetMap, assetsLoading },
  } = useContext(UserContext);

  const { data: _account } = useAccount();
  const account = _account?.address;
  const { data: ensName } = useEnsName();

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const ethBalance = assetMap.get(WETH)?.balance_;

  return (
    <>
      <SidebarSettings settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} />

      <Box direction="row" gap="xsmall" align="center">
        {!mobile && <SettingsBalances />}
        <Box onClick={() => setSettingsOpen(true)}>
          {mobile ? (
            <Box>
              <FiSettings />
            </Box>
          ) : (
            <Box direction="row" align="center">
              <ConnectButton chainStatus="none" />
              <YieldAvatar address={account} size={2} />
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default YieldAccount;

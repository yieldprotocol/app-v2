import { useState, useContext } from 'react';
import styled from 'styled-components';
import { Text, Box, ResponsiveContext } from 'grommet';
import { FiSettings } from 'react-icons/fi';
import Skeleton from './wraps/SkeletonWrap';
import { ChainContext } from '../contexts/ChainContext';
import { abbreviateHash } from '../utils/appUtils';
import YieldAvatar from './YieldAvatar';
import SidebarSettings from './Sidebar';
import EthMark from './logos/EthMark';
import { UserContext } from '../contexts/UserContext';
import { WETH } from '../config/assets';
import SettingsBalances from './SettingsBalances';
import { useEns } from '../hooks/useEns';
import GeneralButton from './buttons/GeneralButton';

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
    chainState: {
      connection: { account },
    },
  } = useContext(ChainContext);

  const {
    userState: { assetMap, assetsLoading },
  } = useContext(UserContext);

  const { ensName } = useEns();
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [connectOpen, setConnectOpen] = useState<boolean>(false);

  const ethBalance = assetMap.get(WETH)?.balance_;

  return (
    <>
      <SidebarSettings
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        connectOpen={connectOpen}
        setConnectOpen={setConnectOpen}
      />

      {account ? (
        <Box direction="row" gap="xsmall" align="center">
          {!mobile && <SettingsBalances />}
          <StyledBox round onClick={() => setSettingsOpen(true)} pad="xsmall" justify="center">
            {mobile ? (
              <Box>
                <FiSettings />
              </Box>
            ) : (
              <Box direction="row" align="center" gap="small">
                <Box>
                  <Text color="text" size="small">
                    {ensName || abbreviateHash(account, 5)}
                  </Text>

                  <Box direction="row" align="center" gap="small">
                    <Box direction="row" gap="xsmall" align="center">
                      <StyledText size="small" color="text">
                        {assetsLoading && <Skeleton circle height={20} width={20} />}
                        {ethBalance && (
                          <Box height="20px" width="20px">
                            <EthMark />
                          </Box>
                        )}
                      </StyledText>
                      <StyledText size="small" color="text">
                        {assetsLoading ? <Skeleton width={40} /> : ethBalance}
                      </StyledText>
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <YieldAvatar address={account} size={2} />
                </Box>
              </Box>
            )}
          </StyledBox>
        </Box>
      ) : (
        <GeneralButton action={() => setConnectOpen(true)} background="gradient-transparent">
          <Text size="small" color="text">
            Connect Wallet
          </Text>
        </GeneralButton>
      )}
    </>
  );
};

export default YieldAccount;

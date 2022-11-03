import { useState, useContext } from 'react';
import styled from 'styled-components';
import { Text, Box, ResponsiveContext } from 'grommet';
import Sidebar from './Sidebar';
import { UserContext } from '../contexts/UserContext';
import { useAccount, useBalance, useEnsName } from 'wagmi';
import { FiSettings } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import { abbreviateHash, cleanValue } from '../utils/appUtils';
import GeneralButton from './buttons/GeneralButton';
import EthMark from './logos/EthMark';
import YieldAvatar from './YieldAvatar';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import YieldBalances from './HeaderBalances';

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

const HeaderAccount = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const { data: ensName } = useEnsName();
  const { openConnectModal } = useConnectModal();
  const { address: account } = useAccount();
  const { data: ethBalance } = useBalance({ addressOrName: account });

  const {
    userState: { assetsLoading },
  } = useContext(UserContext);

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  return (
    <Box gap="medium" direction="row">
      <Sidebar settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} />

      <YieldBalances />
      {account ? (
        <Box direction="row" gap="xsmall" align="center">
          <StyledBox round onClick={() => setSettingsOpen(true)} pad="xsmall" justify="center">
            {mobile ? (
              <Box>
                <FiSettings />
              </Box>
            ) : (
              <Box direction="row" align="center" gap="small">
                <Box>
                  <Text color="text" size="small">
                    {ensName || abbreviateHash(account!, 5)}
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
                        {cleanValue(ethBalance?.formatted, 2) || <Skeleton width={40} />}
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
        openConnectModal && (
          <GeneralButton action={openConnectModal} background="gradient-transparent">
            <Text size="small" color="text">
              Connect Wallet
            </Text>
          </GeneralButton>
        )
      )}
    </Box>
  );
};

export default HeaderAccount;
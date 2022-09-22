import { useState, useContext } from 'react';
import styled from 'styled-components';
import { Text, Box, ResponsiveContext } from 'grommet';
import { FiSettings } from 'react-icons/fi';
import Skeleton from './wraps/SkeletonWrap';
import { abbreviateHash } from '../utils/appUtils';
import YieldAvatar from './YieldAvatar';
import Sidebar from './Sidebar';
import EthMark from './logos/EthMark';
import { UserContext } from '../contexts/UserContext';
import { WETH } from '../config/assets';
import HeaderBalancesModal from './HeaderBalancesModal';
import GeneralButton from './buttons/GeneralButton';
import { ConnectKitButton, useModal } from 'connectkit';

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

const HeaderAccount = (props: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  // const { address } = useAccount();
  // const { data: ensName, isError, isLoading } = useEnsName({ address });

  const {
    userState: { assetMap, assetsLoading },
  } = useContext(UserContext);

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const {open:connectOpen, setOpen} = useModal();
 
  const ethBalance = assetMap.get(WETH)?.balance_;

  return (
    <>
      <Sidebar
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
      />
      
      <ConnectKitButton.Custom>
        {({ isConnected, isConnecting, show, hide, address, ensName }) => {
          return isConnected ? (
            <Box direction="row" gap="xsmall" align="center">
              {!mobile && <HeaderBalancesModal />}
              <StyledBox round onClick={() => setSettingsOpen(true)} pad="xsmall" justify="center">
                {mobile ? (
                  <Box>
                    <FiSettings />
                  </Box>
                ) : (
                  <Box direction="row" align="center" gap="small">
                    <Box>
                      <Text color="text" size="small">
                        {ensName || abbreviateHash(address, 5)}
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
                      <YieldAvatar address={address} size={2} />
                    </Box>
                  </Box>
                )}
              </StyledBox>
            </Box>
          ) : (!isConnecting && !connectOpen ) ? (
            <GeneralButton action={show} background="gradient-transparent">
              <Text size="small" color="text">
                Connect Wallet
              </Text>
            </GeneralButton>
          ) : (
            <Skeleton width={80} onClick={setOpen(true) } />
          );
        }}
      </ConnectKitButton.Custom>
    </>
  );
};

export default HeaderAccount;

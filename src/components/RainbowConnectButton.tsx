import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Box, ResponsiveContext, Text } from 'grommet';
import { useContext } from 'react';
import { FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
import { useAccount, useBalance } from 'wagmi';
import { abbreviateHash } from '../utils/appUtils';
import EthMark from './logos/EthMark';
import Skeleton from './wraps/SkeletonWrap';
import YieldAvatar from './YieldAvatar';

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

interface IProps {
  setSettingsOpen: (isOpen: boolean) => void;
  chainOnly?: boolean;
}

const RainbowConnectButton = ({ setSettingsOpen, chainOnly }: IProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const { data: _account } = useAccount();
  const { data: ethBalance, isLoading } = useBalance({ addressOrName: _account?.address });

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => (
        <div
          {...(!mounted && {
            'aria-hidden': true,
            style: {
              opacity: 0,
              pointerEvents: 'none',
              userSelect: 'none',
            },
          })}
        >
          {(() => {
            if (!mounted || !account || !chain) {
              return <ConnectButton />;
            }

            if (chain.unsupported) {
              return (
                <button onClick={openChainModal} type="button">
                  Wrong network
                </button>
              );
            }

            return (
              <StyledBox round onClick={() => setSettingsOpen(true)} pad="xsmall" justify="center">
                {mobile ? (
                  <Box>
                    <FiSettings />
                  </Box>
                ) : (
                  <Box direction="row" align="center" gap="small">
                    <Box>
                      <Text color="text" size="small">
                        {account.ensName || abbreviateHash(account.address, 5)}
                      </Text>

                      <Box direction="row" align="center" gap="small">
                        <Box direction="row" gap="xsmall" align="center">
                          <StyledText size="small" color="text">
                            <Box height="20px" width="20px">
                              {isLoading ? <Skeleton circle height={20} width={20} /> : <EthMark />}
                            </Box>
                          </StyledText>
                          <StyledText size="small" color="text">
                            {isLoading ? <Skeleton width={40} /> : ethBalance?.formatted}
                          </StyledText>
                        </Box>
                      </Box>
                    </Box>
                    {account && <YieldAvatar address={account.address} size={2} />}
                  </Box>
                )}
              </StyledBox>
            );
          })()}
        </div>
      )}
    </ConnectButton.Custom>
  );
};

export default RainbowConnectButton;

import { useContext, useState } from 'react';
import styled from 'styled-components';
import { Button, Box, Text, Layer, ResponsiveContext } from 'grommet';
import { useColorScheme } from '../../hooks/useColorScheme';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const StyledButton: any = styled(Button)`
  -webkit-transition: transform 0.2s ease-in-out;
  -moz-transition: transform 0.2s ease-in-out;
  transition: transform 0.2s ease-in-out;

  border: 2px solid transparent;
  border-radius: 100px;

  background: ${(props: any) =>
    props.errorLabel
      ? `linear-gradient(${props.background},${props.background}) padding-box, #F87171 border-box`
      : `linear-gradient(${props.background}, ${props.background}) padding-box, -webkit-linear-gradient(135deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82) border-box`};

  :hover:enabled {
    transform: scale(1.02);
    box-shadow: none;
    background: -webkit-linear-gradient(
      135deg,
      #f7953380,
      #f3705580,
      #ef4e7b80,
      #a166ab80,
      #5073b880,
      #1098ad80,
      #07b39b80,
      #6fba8280
    );
  }

  :active:enabled {
    transform: scale(1);
  }

  :disabled {
    transform: scale(0.9);
    opacity: ${(props: any) => (props.errorLabel ? '0.8 !important' : '0.2 !important')};
  }
`;

function ActionButtonWrap({ children, pad }: { children: any; pad?: boolean }) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const theme = useColorScheme();

  return mobile ? (
    <Layer position="bottom" background="background" modal={false} responsive={false} full="horizontal" animate={false}>
      <Box gap="small" fill="horizontal" pad="small">
        {children}
      </Box>
    </Layer>
  ) : (
    <>
      <Box
        gap="small"
        fill="horizontal"
        pad={pad ? { horizontal: 'large', vertical: 'medium', bottom: 'large' } : undefined}
        alignSelf="end"
      >
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
            // Note: If your app doesn't use authentication, you
            const connected = mounted && account && chain;

            return !connected ? (
              children
            ) : (
              <StyledButton
                background={theme === 'dark' ? '#181818' : '#FEFEFE'}
                secondary
                label={
                  <Text size={mobile ? 'small' : undefined} color="text">
                    Connect Wallet
                  </Text>
                }
                onClick={()=>openConnectModal()}
              />
            );
          }}
        </ConnectButton.Custom>
      </Box>
    </>
  );
}

ActionButtonWrap.defaultProps = { pad: false };

export default ActionButtonWrap;

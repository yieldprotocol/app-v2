import { useContext, useState } from 'react';
import styled from 'styled-components';
import { Button, Box, Text, Layer, ResponsiveContext } from 'grommet';
import { ChainContext } from '../../contexts/ChainContext';
import SidebarSettings from '../Sidebar';

const StyledButton = styled(Button)`
  /* height: ${(props: any) => (props.mobile ? '2em' : '4.5em')}; */
  border-radius: 100px;
  :hover {
    box-shadow: 0px 0px 0px 1px;
  }
  :disabled {
    box-shadow: none;
    opacity: ${(props: any) => (props.errorLabel ? '0.8 !important' : '0.2 !important')};
  }
`;

function ActionButtonWrap({ children, pad }: { children: any; pad?: boolean }) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    chainState: {
      connection: { account },
    },
  } = useContext(ChainContext);

  const [connectOpen, setConnectOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

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
        alignSelf='end'
      >
        {account ? (
          children
        ) : (
          <StyledButton
            secondary
            label={<Text size={mobile ? 'small' : undefined}>Connect Wallet</Text>}
            onClick={() => setConnectOpen(true)}
          />
        )}
      </Box>
      <SidebarSettings
        connectOpen={connectOpen}
        setConnectOpen={setConnectOpen}
        setSettingsOpen={setSettingsOpen}
        settingsOpen={settingsOpen}
      />
    </>
  );
}

ActionButtonWrap.defaultProps = { pad: false };

export default ActionButtonWrap;

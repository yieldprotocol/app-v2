import React, { useContext, useState } from 'react';
import { Box, Button, Header, Image, Text } from 'grommet';
import styled, { CSSProperties, ThemeContext } from 'styled-components';
import { useHistory } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { IUserContext, IVault, IVaultRoot, MenuView } from '../types';

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

const YieldMenu = ({ toggleMenu }: { toggleMenu: () => void }) => {
  /* state from contexts */
  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { vaultMap } = userState;
  const { setSelectedVault } = userActions;

  const routerHistory = useHistory();
  const theme = useContext<any>(ThemeContext);
  const textColor = theme.global.colors.brand;
  const textBack = theme.global.colors['light-1'];
  const activeStyle = {
    transform: 'scale(1.1)',
    color: `${textColor}`,
    background: `${textBack}`,
  } as CSSProperties;

  /* local state */
  const [vaultsArray, setVaultsArray] = useState<IVault[]>(Array.from(vaultMap.values()));
  const [view, setView] = useState<MenuView>(vaultsArray.length > 0 ? MenuView.settings : MenuView.account);

  const handleSelect = (vault: IVault) => {
    setSelectedVault(vault.id);
    // routerHistory.push(`/vault/${vault.id}`);
    toggleMenu();
  };

  const handleRouting = (route: string) => {
    routerHistory.push(`/${route}`);
    toggleMenu();
  };

  return (
    <>
      <Header pad="medium" height="xsmall" justify="between">
        <Box direction="row" justify="evenly" fill="horizontal">
          <StyledBox
            onClick={() => setView(MenuView.settings)}
            style={view === MenuView.settings ? activeStyle : undefined}
          >
            <Text size="small">My Account</Text>
          </StyledBox>

          <StyledBox
            onClick={() => setView(MenuView.account)}
            style={view === MenuView.account ? activeStyle : undefined}
          >
            <Text size="small">Settings</Text>
          </StyledBox>
        </Box>
      </Header>

      <Box flex overflow="auto" pad="medium" fill="horizontal">
        {view === MenuView.account && <Box> Accounts view </Box>}

        {view === MenuView.settings && (
          <Box gap="medium">
            {/* { vaultsArray.map((x:IVault) => (
              <Box
                key={x.id}
                pad="small"
                border
                onClick={() => handleSelect(x)}
                direction="row"
                align="center"
              >
                <Box width="xxsmall">
                  <Image src={x.image} />
                </Box>
                <Box align="center" fill="horizontal">
                  <Text size="small"> {x.id} {x.seriesId} </Text>
                </Box>
              </Box>
            ))}
            {vaultsArray.length === 0 &&
            <Box
              gap="large"
              pad="large"
              align="center"
            >
              <Text size="small"> You don't have any vaults yet, create one by:  </Text>
              <Box direction="row" justify="evenly" fill>
                <Box pad="small" border onClick={() => handleRouting('borrow')}>Borrowing</Box>
              </Box>

              <Text size="small"> Or try:  </Text>
              <Box direction="row" justify="evenly" fill>
                <Box pad="small" border onClick={() => handleRouting('lend')}>Lending</Box>
                <Box pad="small" border onClick={() => handleRouting('pool')}>Pooling</Box>
              </Box>

            </Box>} */}
          </Box>
        )}
      </Box>

      <Box as="footer" border={{ side: 'top' }} pad="small" justify="end" direction="row" align="center">
        <Button onClick={() => toggleMenu()} label="Close" />
      </Box>
    </>
  );
};

export default YieldMenu;

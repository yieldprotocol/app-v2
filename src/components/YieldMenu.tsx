import React, { useContext, useState } from 'react';
import { Box, Button, Header, Image, Text } from 'grommet';
import styled, { CSSProperties, ThemeContext } from 'styled-components';
import { useHistory } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { IVaultRoot, View } from '../types';

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

const YieldMenu = ({ toggleMenu }: { toggleMenu: ()=>void }) => {
  /* state from contexts */
  const { userState: { vaultMap, activeVault }, userActions: { setActiveVault } } = useContext(UserContext);
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
  const [vaultsArray, setVaultsArray] = useState<IVaultRoot[]>(Array.from(vaultMap.values() as IVaultRoot[]));
  const [view, setView] = useState<View>(vaultsArray.length > 0 ? View.vaults : View.account);

  const handleSelect = (vaultId:string) => {
    setActiveVault(vaultMap.get(vaultId));
    routerHistory.push(`/vault/${vaultId}`);
    toggleMenu();
  };

  const handleRouting = (route:string) => {
    routerHistory.push(`/${route}`);
    toggleMenu();
  };

  return (
    <>
      <Header pad="medium" height="xsmall" justify="between">
        <Box direction="row" justify="evenly" fill="horizontal">
          <StyledBox
            onClick={() => setView(View.vaults)}
            style={view === View.vaults ? activeStyle : undefined}
          >
            <Text size="small">
              My Vaults
            </Text>
          </StyledBox>

          <StyledBox
            onClick={() => setView(View.account)}
            style={view === View.account ? activeStyle : undefined}
          >
            <Text size="small">
              Account Details
            </Text>
          </StyledBox>
        </Box>
      </Header>

      <Box flex overflow="auto" pad="medium" fill="horizontal">
        { view === View.account && <Box> Accounts view </Box>}

        {
          view === View.vaults &&
          <Box gap="medium">
            { vaultsArray.map((x:IVaultRoot) => (
              <Box
                key={x.id}
                pad="small"
                border
                onClick={() => handleSelect(x.id)}
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

            </Box>}
          </Box>
          }
      </Box>

      <Box
        as="footer"
        border={{ side: 'top' }}
        pad="small"
        justify="end"
        direction="row"
        align="center"
      >
        <Button onClick={() => toggleMenu()} label="Close" />
      </Box>
    </>
  );
};

export default YieldMenu;

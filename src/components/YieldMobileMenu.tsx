import React, { useContext, useState } from 'react';
import { Box, Button, Collapsible, Footer, Header, Layer, ResponsiveContext, Text } from 'grommet';
import { NavLink, useHistory } from 'react-router-dom';
import { FiX, FiArrowLeftCircle } from 'react-icons/fi';
import styled, { CSSProperties, ThemeContext } from 'styled-components';

import { UserContext } from '../contexts/UserContext';
import { IUserContext, IVault, IVaultRoot, View } from '../types';
import YieldNavigation from './YieldNavigation';
import YieldMenu from './YieldMenu';

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

const YieldMobileMenu = ({ toggleMenu }: { toggleMenu: ()=>void }) => {
  /* state from contexts */
  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { vaultMap } = userState;
  const { setSelectedVault } = userActions;

  const [view, setView] = useState<string | undefined>(undefined);
  const routerHistory = useHistory();

  const theme = useContext<any>(ThemeContext);
  const textColor = theme.global.colors.brand;
  const textBack = theme.global.colors['light-1'];

  const handleSelect = (vaultId:string) => {
    setSelectedVault(vaultId);
    routerHistory.push(`/vault/${vaultId}`);
    toggleMenu();
  };

  const activeStyle = {
    transform: 'scale(1.1)',
    // fontWeight: 'bold',
    color: `${textColor}`,
    background: `${textBack}`,
  } as CSSProperties;

  return (
    <Box justify="between" fill>
      <Header
        pad="medium"
        justify="between"
      >
        <Box background="brand" pad="xsmall">
          <Text size="xsmall"> YIELD</Text>
        </Box>
        <Box onClick={() => toggleMenu()} pad="small">
          <Text size="small" color="text"> <FiX /> </Text>
        </Box>
      </Header>

      { !view && <YieldNavigation callbackFn={() => toggleMenu()} /> }

      { view &&
        <Box
          flex
          overflow="auto"
          pad={{ horizontal: 'medium' }}
          fill
        >
          <Header pad="medium" justify="between">
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

          { view === View.account && <Box> Accounts view </Box>}

          {
          view === View.vaults &&
          <Box gap="medium">
            { Array.from(vaultMap.values()).map((x:IVault) => (
              <Box
                key={x.id}
                pad="small"
                border
                onClick={() => handleSelect(x.id)}
              >
                <Text size="small"> {x.id} {x.seriesId} </Text>
              </Box>
            ))}
          </Box>
          }

        </Box>}

      <Box direction="row" pad="medium" fill="horizontal" justify="center">
        { !view && <Box onClick={() => setView(View.vaults)}> <Text size="small">Vaults and Account</Text>  </Box> }
        { view &&
        <Box onClick={() => setView(undefined)} gap="medium" direction="row" align="center">
          <FiArrowLeftCircle />
          <Text size="small"> back to menu </Text>
        </Box> }
      </Box>

    </Box>

  );
};

// YieldMobileMenu.defaultProps = { callback: () => null };

export default YieldMobileMenu;

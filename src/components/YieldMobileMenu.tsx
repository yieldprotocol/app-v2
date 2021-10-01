import React, { useContext, useState } from 'react';
import { Box, Button, Collapsible, Footer, Header, Layer, ResponsiveContext, Text } from 'grommet';
import { NavLink, useHistory } from 'react-router-dom';
import { FiX, FiArrowLeftCircle } from 'react-icons/fi';
import styled, { CSSProperties, ThemeContext } from 'styled-components';

import { UserContext } from '../contexts/UserContext';
import { IUserContext, IVault, IVaultRoot, MenuView } from '../types';
import YieldNavigation from './YieldNavigation';
import YieldMark from './logos/YieldMark';

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

const YieldMobileMenu = ({ toggleMenu }: { toggleMenu: () => void }) => {
  /* state from contexts */
  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { vaultMap } = userState;
  const { setSelectedVault } = userActions;

  const [view, setView] = useState<string | undefined>(undefined);
  const routerHistory = useHistory();

  const theme = useContext<any>(ThemeContext);
  const textColor = theme.global.colors.brand;
  const textBack = theme.global.colors['light-1'];

  const handleSelect = (vault: IVault) => {
    setSelectedVault(vault.id);
    routerHistory.push(`/vault/${vault.id}`);
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
      <Header pad="medium" justify="between">
        <YieldMark
          height="1.5rem"
          colors={['#f79533', '#f37055', '#ef4e7b', '#a166ab', '#5073b8', '#1098ad', '#07b39b', '#6fba82']}
        />
        <Box onClick={() => toggleMenu()} pad="small">
          <Box>
            <FiX size="1.5rem" />
          </Box>
        </Box>
      </Header>

      {!view && <YieldNavigation callbackFn={() => toggleMenu()} />}

      {view && (
        <Box flex overflow="auto" pad={{ horizontal: 'medium' }} fill>
          <Header pad="medium" justify="between">
            <Box direction="row" justify="evenly" fill="horizontal">
              <StyledBox
                onClick={() => setView(MenuView.vaults)}
                style={view === MenuView.vaults ? activeStyle : undefined}
              >
                <Text size="small">My Vaults</Text>
              </StyledBox>
            </Box>
          </Header>
        </Box>
      )}
    </Box>
  );
};

export default YieldMobileMenu;

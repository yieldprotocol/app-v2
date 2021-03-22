import React, { useContext, useState } from 'react';
import { Box, Button, Header, Text } from 'grommet';
import styled, { CSSProperties, ThemeContext } from 'styled-components';
import { useHistory } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { IMenuProps, View } from '../types';

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

const YieldMenu = ({ toggleMenu }: IMenuProps) => {
  const [view, setView] = useState<View>(View.vaults);
  const { userState: { vaultMap, activeVault } } = useContext(UserContext);
  const routerHistory = useHistory();

  const theme = useContext<any>(ThemeContext);
  const textColor = theme.global.colors.brand;
  const textBack = theme.global.colors['light-1'];
  const activeStyle = {
    transform: 'scale(1.1)',
    color: `${textColor}`,
    background: `${textBack}`,
  } as CSSProperties;

  const handleSelect = (vaultId:string) => {
    routerHistory.push(`/vault/${vaultId}`);
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
            { Array.from(vaultMap.values()).map((x:any) => (
              <Box
                key={x.id}
                pad="small"
                border
                onClick={() => handleSelect(x)}
              >
                {x.id}
              </Box>
            ))}
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

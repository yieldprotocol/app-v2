import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled, { CSSProperties } from 'styled-components';
import {
  Text,
  Box,
  ThemeContext,
  ResponsiveContext,
} from 'grommet';

const StyledLink = styled(NavLink)`
  text-decoration: none;
  padding: 8px;

  -webkit-transition: background 0.3s ease-in-out;
  -moz-transition: background 0.3s ease-in-out;
  transition: background 0.3s ease-in-out;

  -webkit-transition: box-shadow 0.3s ease-in-out;
  -moz-transition: box-shadow 0.3s ease-in-out;
  transition: box-shadow 0.3s ease-in-out;

  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;

  :hover {
    transform: scale(1.2);
  }
`;

const YieldNavigation = (props: any) => {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const loc = useLocation();

  const theme = useContext<any>(ThemeContext);
  const textColor = theme.dark ? theme.global.colors.text.dark : theme.global.colors.text.light;

  const activeStyle = {
    transform: 'scale(1.1)',
    fontWeight: 'bold',
    color: `${textColor}`,
    background: `${theme.global.colors['light-2']}`,
  } as CSSProperties;

  return (
    <>
      <Box
        direction="row"
        gap="medium"
        align="center"
      >
        <StyledLink
          to="/borrow"
          activeStyle={activeStyle}
          isActive={(match, location:any) => (location.pathname.includes('borrow'))}
        >
          <Text weight="bold" size={mobile ? 'small' : 'medium'}>
            Borrow
          </Text>
        </StyledLink>

        <StyledLink
          to="/lend"
          activeStyle={activeStyle}
        >
          <Text
            weight="bold"
            size={mobile ? 'small' : 'medium'}
          > Lend
          </Text>
        </StyledLink>

        <StyledLink
          to="/pool"
          activeStyle={activeStyle}
        >
          <Text
            weight="bold"
            size={mobile ? 'small' : 'medium'}
          > Pool
          </Text>
        </StyledLink>
      </Box>
    </>
  );
};

export default YieldNavigation;

import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled, { CSSProperties } from 'styled-components';
import {
  Text,
  Box,
  ThemeContext,
  ResponsiveContext,
  Layer,
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

interface IYieldNavigation {
  callbackFn?: any;
}

const YieldNavigation = ({ callbackFn }: IYieldNavigation) => {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const loc = useLocation();

  const theme = useContext<any>(ThemeContext);
  const textColor = theme.global.colors.brand;
  const textBack = theme.global.colors['light-1'];

  const activeStyle = {
    transform: 'scale(1.1)',
    color: `${textColor}`,
    background: `${textBack}`,
  } as CSSProperties;

  const linksArr = [
    { label: 'Borrow', to: '/borrow' },
    { label: 'Lend', to: '/lend' },
    { label: 'Pool', to: '/pool' },
    // { label: 'Markets', to: '/markets' },
  ];

  return (

    <Box
      direction={mobile ? 'column' : 'row'}
      gap="medium"
      align="center"
      justify="center"
      fill={mobile}
    >
      { linksArr.map((x: any) => (
        <StyledLink to={x.to} activeStyle={activeStyle} key={x.label} onClick={() => callbackFn()}>
          <Text color={mobile ? 'text' : undefined} size={mobile ? 'small' : undefined}> {x.label} </Text>
        </StyledLink>
      ))}
    </Box>
  );
};

YieldNavigation.defaultProps = { callbackFn: () => null };

export default YieldNavigation;

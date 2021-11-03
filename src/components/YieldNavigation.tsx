import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import styled, { CSSProperties } from 'styled-components';
import { Box, ThemeContext, ResponsiveContext } from 'grommet';
import NavText from './texts/NavText';
import { ChainContext } from '../contexts/ChainContext';
import { useWindowSize } from '../hooks/generalHooks';
import { UserContext } from '../contexts/UserContext';
import { SettingsContext } from '../contexts/SettingsContext';

const StyledLink = styled(NavLink)`
  text-decoration: none;
  /* padding: 8px; */
  border-radius: 5px;

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
    /* background: #ffffff69; */
  }
`;

interface IYieldNavigationProps {
  sideNavigation?: boolean;
  callbackFn?: any;
}

const YieldNavigation = ({ sideNavigation, callbackFn }: IYieldNavigationProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const [height] = useWindowSize();
  const {
    chainState: {
      connection: { account },
    },
  } = useContext(ChainContext);
  const {
    settingsState: { darkMode },
  } = useContext(SettingsContext);

  const theme = useContext<any>(ThemeContext);
  const textColor = theme.global.colors.text;
  const activeStyle = {
    transform: !sideNavigation ? 'scale(1.3)' : 'scale(1.3)',
    color: darkMode ? `${textColor.dark}` : `${textColor.light}`,
    marginLeft: !mobile && sideNavigation ? '1em' : undefined,
  } as CSSProperties;

  const linksArr = [
    { label: 'BORROW', to: '/borrow' },
    { label: 'LEND', to: '/lend' },
    { label: 'POOL', to: '/pool' },
    { label: 'DASHBOARD', to: '/dashboard', disabled: !account },
  ];

  const Link = ({ link }: { link: any }) => (
    <StyledLink
      to={link.to}
      activeStyle={activeStyle}
      onClick={() => callbackFn()}
      style={{ color: darkMode ? 'gray' : 'gray' }}
    >
      <NavText size={mobile ? 'medium' : 'small'}>{link.label}</NavText>
    </StyledLink>
  );

  return (
    <>
      {!mobile && !sideNavigation && height > 800 && (
        <Box
          direction={mobile ? 'column' : 'row'}
          gap="2em"
          pad={mobile ? { vertical: 'xlarge' } : undefined}
          align="center"
          justify={mobile ? undefined : 'center'}
          fill={mobile}
        >
          {linksArr.map((x: any) => (!x.disabled ? <Link link={x} key={x.label} /> : null))}
        </Box>
      )}

      {mobile && (
        <Box direction="column" gap="medium" pad={{ vertical: 'xlarge' }} align="center" fill>
          {linksArr.map((x: any) => (!x.disabled ? <Link link={x} key={x.label} /> : null))}
        </Box>
      )}

      {!mobile && sideNavigation && height < 800 ? (
        <Box pad={{ vertical: '3em' }} direction="column" gap="small">
          {linksArr.map((x: any) => (!x.disabled ? <Link link={x} key={x.label} /> : null))}
        </Box>
      ) : (
        <Box />
      )}
    </>
  );
};

YieldNavigation.defaultProps = { sideNavigation: false, callbackFn: () => null };

export default YieldNavigation;

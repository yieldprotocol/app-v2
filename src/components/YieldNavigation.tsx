import { useRouter } from 'next/router';
import Link from 'next/link';
import { useContext } from 'react';
import styled, { CSSProperties } from 'styled-components';
import { Box, ThemeContext, ResponsiveContext, Text } from 'grommet';
import NavText from './texts/NavText';
import { ChainContext } from '../contexts/ChainContext';
import { useWindowSize } from '../hooks/generalHooks';
import { SettingsContext } from '../contexts/SettingsContext';
import { ISettingsContext } from '../types';
import { useAccount } from 'wagmi';

const StyledLink = styled.div`
  text-decoration: none;
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
    cursor: pointer;
  }
`;

interface IYieldNavigationProps {
  sideNavigation?: boolean;
  callbackFn?: any;
}

const YieldNavigation = ({ sideNavigation, callbackFn }: IYieldNavigationProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const router = useRouter();
  const [height] = useWindowSize();

  const {isConnected} = useAccount();
 
  const {
    settingsState: { darkMode },
  } = useContext(SettingsContext) as ISettingsContext;

  const theme = useContext<any>(ThemeContext);
  const textColor = theme.global.colors.text;

  const activelinkStyle = {
    color: darkMode ? `${textColor.dark}` : `${textColor.light}`,
    transform: !sideNavigation ? 'scale(1.3)' : 'scale(1.3)',
    marginLeft: !mobile && sideNavigation ? '1em' : undefined,
  } as CSSProperties;

  const linksArr = [
    { label: 'BORROW', to: '/borrow' },
    { label: 'LEND', to: '/lend' },
    { label: 'POOL', to: '/pool' },
    { label: 'DASHBOARD', to: '/dashboard', disabled: !isConnected},
  ];

  const NavLink = ({ link }: { link: any }) => (
    <Link href={link.to} >  
      <StyledLink onClick={()=>callbackFn()} style={router.pathname.includes(link.to) ? activelinkStyle : { color: 'lightGrey' }}>
        <NavText size={mobile ? 'medium' : 'small'}>{link.label}</NavText>
      </StyledLink>
    </Link>
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
          {linksArr.map((x) => (!x.disabled ? <NavLink link={x} key={x.label} /> : null))}
        </Box>
      )}

      {mobile && (
        <Box direction="column" gap="medium" pad={{ vertical: 'xlarge' }} align="center" fill>
          {linksArr.map((x) => (!x.disabled ? <NavLink link={x} key={x.label} /> : null))}
        </Box>
      )}

      {!mobile && sideNavigation && height < 800 ? (
        <Box pad={{ vertical: '3em' }} direction="column" gap="small">
          {linksArr.map((x) => (!x.disabled ? <NavLink link={x} key={x.label} /> : null))}
        </Box>
      ) : (
        <Box />
      )}
    </>
  );
};

YieldNavigation.defaultProps = { sideNavigation: false, callbackFn: () => null };

export default YieldNavigation;

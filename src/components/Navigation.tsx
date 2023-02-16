import { useRouter } from 'next/router';
import Link from 'next/link';
import { useContext } from 'react';
import styled, { CSSProperties } from 'styled-components';
import { Box, ThemeContext, ResponsiveContext, Text } from 'grommet';
import { useWindowSize } from '../hooks/generalHooks';
import { SettingsContext } from '../contexts/SettingsContext';
import { useAccount } from 'wagmi';
import useAnalytics from '../hooks/useAnalytics';
import { GA_Event, GA_Properties } from '../types/analytics';
import NavText from './texts/NavText';

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

const StyledText = styled(Text)`
  font-family: 'Raleway';
  /* background: -webkit-linear-gradient(#7255bd, #d95948);
  background: ${(props) => props.color};
  background: -webkit-linear-gradient(60deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82);
  -webkit-background-clip: text; 
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(2px 2px 2px #ddd);  */
`;

interface IYieldNavigationProps {
  sideNavigation?: boolean;
  callbackFn?: any;
}

const Navigation = ({ sideNavigation, callbackFn }: IYieldNavigationProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const router = useRouter();
  const { logAnalyticsEvent } = useAnalytics();

  const [height] = useWindowSize();

  const { isConnected } = useAccount();

  const {
    settingsState: { darkMode },
  } = useContext(SettingsContext);

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
    { label: 'DASHBOARD', to: '/dashboard', disabled: !isConnected },
  ];

  const handleViewChange = (toView: string) => {
    // console.log(toView.slice(1));
    logAnalyticsEvent(GA_Event.view_changed, {
      toView: toView.slice(1),
    } as GA_Properties.view_changed);
  };

  const NavLink = ({ link }: { link: any }) => (
    <Link href={link.to} passHref>
      <StyledLink
        onClick={() => handleViewChange(link.to)}
        style={router.pathname.includes(link.to) ? activelinkStyle : { color: 'gray' }}
      >
        <NavText size={mobile ? 'medium' : 'small'}>{link.label}</NavText>
      </StyledLink>
    </Link>
  );

  return (
    <>
      {!mobile && !sideNavigation && height! > 800 && (
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

      {!mobile && sideNavigation && height! < 800 ? (
        <Box pad={{ vertical: '3em' }} direction="column" gap="small">
          {linksArr.map((x) => (!x.disabled ? <NavLink link={x} key={x.label} /> : null))}
        </Box>
      ) : (
        <Box />
      )}
    </>
  );
};

Navigation.defaultProps = { sideNavigation: false, callbackFn: () => null };

export default Navigation;

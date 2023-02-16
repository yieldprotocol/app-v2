import { forwardRef, useContext, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { FiMenu } from 'react-icons/fi';
import { Box, Header, Grid, ResponsiveContext, Avatar } from 'grommet';

import Navigation from './Navigation';
import HeaderAccount from './HeaderAccount';
import YieldMark from './logos/YieldMark';

import BackButton from './buttons/BackButton';
import { useColorScheme } from '../hooks/useColorScheme';
import DashMobileButton from './buttons/DashMobileButton';
import { useAccount } from 'wagmi';

const StyledAvatar = styled(Avatar)`
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

interface IYieldHeaderProps {
  actionList: any[];
}

const YieldHeader = ({ actionList }: IYieldHeaderProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isPositionPath = router.pathname.includes('position');
  const [yieldMarkhover, setYieldMarkHover] = useState<boolean>(false);

  const { isConnected } = useAccount();

  // eslint-disable-next-line react/display-name
  const YieldIcon = forwardRef(({ onClick, href }: any, ref: any) => (
    <a href={href} onClick={onClick} ref={ref}>
      <StyledAvatar
        background="hoverBackground"
        size="3rem"
        onMouseOver={() => setYieldMarkHover(true)}
        onMouseLeave={() =>
          setTimeout(() => {
            setYieldMarkHover(false);
          }, 300)
        }
      >
        {yieldMarkhover ? (
          <YieldMark
            height="1.75rem"
            colors={['#f79533', '#f37055', '#ef4e7b', '#a166ab', '#5073b8', '#1098ad', '#07b39b', '#6fba82']}
          />
        ) : (
          <YieldMark colors={colorScheme === 'dark' ? ['white'] : ['black']} height="1.75rem" />
        )}
      </StyledAvatar>
    </a>
  ));

  return (
    <Header
      pad={mobile ? 'medium' : 'large'}
      height={mobile ? undefined : 'xsmall'}
      style={{ position: 'fixed', top: '0px' }}
      direction="row"
      fill="horizontal"
      background={mobile ? undefined : 'background'}
      elevation={undefined}
    >
      <Grid columns={['auto', '1fr', 'auto']} fill="horizontal">
        <Box direction="row" gap="large" align="center">
          {mobile && !isPositionPath && (
            <Box onClick={actionList[0]}>
              <FiMenu size="1.5rem" />
            </Box>
          )}
          {mobile && isPositionPath && <BackButton action={() => router.back()} />}
          {!mobile && (
            <Link href="/borrow" passHref>
              <YieldIcon />
            </Link>
          )}
          {!mobile && <Navigation />}
        </Box>
        <Box />

        <Box align="center" direction="row" gap="small">
          {isConnected && mobile && router.pathname !== '/dashboard' && <DashMobileButton />}
          <HeaderAccount />
        </Box>
      </Grid>
    </Header>
  );
};

export default YieldHeader;

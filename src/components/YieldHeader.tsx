import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import { Box, Header, Grid, ResponsiveContext, Avatar } from 'grommet';

import YieldNavigation from './YieldNavigation';
import YieldAccount from './YieldAccount';
import YieldMark from './logos/YieldMark';

import { useCachedState } from '../hooks/generalHooks';
import BackButton from './buttons/BackButton';
import { useColorScheme } from '../hooks/useColorScheme';

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
  const colorScheme = useColorScheme();
  const history = useHistory();
  const prevLoc = useCachedState('lastVisit', '')[0].slice(1).split('/')[0];
  const isPositionPath = useLocation().pathname.includes('position');
  const [yieldMarkhover, setYieldMarkHover] = useState<boolean>(false);

  return (
    <>
      <Header
        pad={mobile ? 'medium' : 'large'}
        height={mobile ? undefined : 'xsmall'}
        style={{ position: 'fixed', top: '0px' }}
        direction="row"
        fill="horizontal"
        background="background"
        elevation={mobile && isPositionPath ? 'small' : undefined}
      >
        <Grid columns={['auto', '1fr', 'auto']} fill="horizontal">
          <Box direction="row" gap="large" align="center">
            {mobile && !isPositionPath && (
              <Box onClick={actionList[0]}>
                <FiMenu size="1.5rem" />
              </Box>
            )}
            {mobile && isPositionPath && <BackButton action={() => history.goBack()} />}
            {!mobile && (
              <StyledAvatar
                background="hoverBackground"
                size="3rem"
                onMouseEnter={() => setYieldMarkHover(true)}
                onMouseLeave={() => setYieldMarkHover(false)}
              >
                <NavLink to={`/${prevLoc}`} style={{ height: '50%' }}>
                  {yieldMarkhover ? (
                    <YieldMark
                      height="1.75rem"
                      colors={['#f79533', '#f37055', '#ef4e7b', '#a166ab', '#5073b8', '#1098ad', '#07b39b', '#6fba82']}
                    />
                  ) : (
                    <YieldMark colors={colorScheme === 'dark' ? ['white'] : ['black']} height="1.75rem" />
                  )}
                </NavLink>
              </StyledAvatar>
            )}
            {!mobile && <YieldNavigation />}
          </Box>
          <Box />

          <Box align="end" direction="row">
            {/* {mobile && <Box> Dash </Box>}  */}
            <YieldAccount />
          </Box>
        </Grid>
      </Header>
    </>
  );
};

export default YieldHeader;

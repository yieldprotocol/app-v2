import React, { useContext, useState } from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Avatar, Box, Button, Grid, Header, Layer, ResponsiveContext, Text } from 'grommet';

import { FiLogOut } from 'react-icons/fi';
import MainViewWrap from './MainViewWrap';
import PanelWrap from './PanelWrap';

import { UserContext } from '../../contexts/UserContext';
import YieldMark from '../logos/YieldMark';
import { useCachedState } from '../../hooks/generalHooks';
import { ISeries } from '../../types';
import YieldHeader from '../YieldHeader';
import MenuLayer from '../../layers/MenuLayer';

interface IModalWrap {
  children: any;
  series?: ISeries | undefined;
}

const StyledBox = styled(Box)`
-webkit-transition: transform 0.3s ease-in-out;
-moz-transition: transform 0.3s ease-in-out;
transition: transform 0.3s ease-in-out;
background 0.3s ease-in-out;
:hover {
  transform: scale(1.1);
}
`;

const StyledLayer = styled(Layer)``;

function ModalWrap({ children, series }: IModalWrap) {
  const history = useHistory();
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const prevLoc = useCachedState('lastVisit', '')[0].slice(1).split('/')[0];

  const {
    userState: { selectedSeriesId, seriesMap },
  } = useContext(UserContext);

  const _series = series || seriesMap.get(selectedSeriesId);

  /* LOCAL STATE */
  const [menuLayerOpen, setMenuLayerOpen] = useState<boolean>(false);

  return (
    <StyledLayer
      onClickOutside={() => history.goBack()}
      full
      background={`linear-gradient( 45deg ,  ${_series?.startColor?.toString().concat('80')} , ${_series?.endColor
        ?.toString()
        .concat('80')} )`}
      animation="fadeIn"
    >
      {!mobile && (
        <>
          <Header
            pad="large"
            height={mobile ? undefined : 'xsmall'}
            justify="between"
            fill="horizontal"
            style={{ position: 'fixed', top: '0px' }}
          >
            <Grid columns={['medium', 'flex', 'medium']} fill="horizontal">
              <Box direction="row" gap={mobile ? '0.25em' : 'medium'} align="center">
                {/* <Avatar>
                  <NavLink to={`/${prevLoc}`}>
                    <YieldMark
                      height={mobile ? '1rem' : '1.75rem'}
                      colors ={[ _series?.oppStartColor,_series?.oppEndColor]}
                    />
                  </NavLink>
                  <Box />
                </Avatar> */}
              </Box>
              <Box />
            </Grid>
          </Header>

          <Box flex={!mobile} overflow="auto" margin={mobile ? {} : { top: 'xlarge' }}>
            <MainViewWrap pad={mobile ? 'medium' : 'large'}>
              <PanelWrap>
                <Box />
              </PanelWrap>

              <Box width="600px" pad={{ top: 'large' }}>
                <Box align="end">
                  <StyledBox direction="row" align="center" onClick={() => history.goBack()}>
                    <Text size="small" color={_series?.oppStartColor || 'black'}>
                      {' '}
                      Close{' '}
                    </Text>
                    <Button icon={<FiLogOut color={_series?.oppStartColor || 'black'} />} />
                  </StyledBox>
                </Box>

                {children}
              </Box>

              <PanelWrap>
                <Box />
              </PanelWrap>
            </MainViewWrap>
          </Box>
        </>
      )}

      {mobile && (
        <Box>
          <YieldHeader actionList={[() => setMenuLayerOpen(!menuLayerOpen)]} />
          {menuLayerOpen ? <MenuLayer toggleMenu={() => setMenuLayerOpen(!menuLayerOpen)} /> : children}
        </Box>
      )}
    </StyledLayer>
  );
}

ModalWrap.defaultProps = { series: undefined };

export default ModalWrap;

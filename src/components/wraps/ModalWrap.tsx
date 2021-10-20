import React, { useContext, useState } from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Avatar, Box, Button, Grid, Header, Keyboard, Layer, ResponsiveContext, Text } from 'grommet';

import { FiLogOut } from 'react-icons/fi';
import MainViewWrap from './MainViewWrap';
import PanelWrap from './PanelWrap';

import { UserContext } from '../../contexts/UserContext';
import YieldMark from '../logos/YieldMark';
import { useCachedState } from '../../hooks/generalHooks';
import { ISeries } from '../../types';
import YieldHeader from '../YieldHeader';
import MenuLayer from '../../layers/MenuLayer';
import ItemWrap from './ItemWrap';

interface IModalWrap {
  children: any;
  series?: ISeries | undefined;
}

const StyledBox = styled(Box)`
-webkit-transition: transform 0.3s ease-in-out;
-moz-transition: transform 0.3s ease-in-out;
transition: transform 0.3s ease-in-out;
background 0.3s ease-in-out;
background-color: white;
:hover {
  transform: scale(1.1);
}
`;

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
    <Keyboard onEsc={() => history.goBack()}>
      <Layer
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
              fill="horizontal"
              style={{ position: 'fixed', top: '0px' }}
            >
              <Box align="end" elevation="xsmall" round="xsmall" fill>
                <Box>
                  <ItemWrap action={() => history.goBack()} index={1}>
                    <Box direction="row" align="center">
                      <Box pad="xsmall">
                        <Text size="small" color={_series?.startColor || 'black'}>
                          Close{' '}
                        </Text>
                      </Box>
                      <Box pad="xsmall">
                        <FiLogOut color={_series?.startColor || 'black'} />
                      </Box>
                    </Box>
                  </ItemWrap>
                </Box>
              </Box>
            </Header>

            <Box flex={!mobile} overflow="auto">
              <MainViewWrap pad={mobile ? 'medium' : 'large'}>
                <PanelWrap>
                  <Box />
                </PanelWrap>

                <Box width="600px" pad={{ top: '5%' }}>
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
      </Layer>
    </Keyboard>
  );
}

ModalWrap.defaultProps = { series: undefined };

export default ModalWrap;

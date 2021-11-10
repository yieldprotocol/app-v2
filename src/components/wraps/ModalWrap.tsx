import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Header, Keyboard, Layer, ResponsiveContext, Text } from 'grommet';

import { FiLogOut } from 'react-icons/fi';
import MainViewWrap from './MainViewWrap';
import PanelWrap from './PanelWrap';

import { UserContext } from '../../contexts/UserContext';
import { ISeries } from '../../types';
import YieldHeader from '../YieldHeader';
import ItemWrap from './ItemWrap';
import YieldMobileMenu from '../YieldMobileMenu';

interface IModalWrap {
  children: any;
  series?: ISeries | undefined;
}

function ModalWrap({ children, series }: IModalWrap) {
  const history = useHistory();
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

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
        background={`linear-gradient( 45deg ,  ${_series?.startColor?.toString()} , ${_series?.endColor
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
              <MainViewWrap >
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
            {menuLayerOpen ? <YieldMobileMenu toggleMenu={() => setMenuLayerOpen(!menuLayerOpen)} /> : children}
          </Box>
        )}
      </Layer>
    </Keyboard>
  );
}

ModalWrap.defaultProps = { series: undefined };

export default ModalWrap;

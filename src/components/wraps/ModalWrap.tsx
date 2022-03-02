import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Header, Keyboard, Layer, ResponsiveContext, Text } from 'grommet';

import { FiLogOut } from 'react-icons/fi';
import MainViewWrap from './MainViewWrap';
import PanelWrap from './PanelWrap';

import { UserContext } from '../../contexts/UserContext';
import { ISeries, IUserContextState } from '../../types';
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
    userState: { selectedSeries, seriesMap },
  }: { userState: IUserContextState } = useContext(UserContext);

  const _series: ISeries = series! || seriesMap.get(selectedSeries?.id!);

  /* LOCAL STATE */
  const [menuLayerOpen, setMenuLayerOpen] = useState<boolean>(false);

  return (
    <Keyboard onEsc={() => history.goBack()}>
      <Layer
        full
        background={`linear-gradient( 45deg ,  ${_series?.startColor.toString()} , ${_series?.endColor
          ?.toString()
          .concat('80')} )`}
        animation="fadeIn"
      >
        {!mobile && (
          <>
            <Box flex={!mobile} overflow="auto">
              <MainViewWrap>
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
          <Box >
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

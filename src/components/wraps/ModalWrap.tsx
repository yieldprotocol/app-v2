import { useRouter } from 'next/router';
import { useContext, useState } from 'react';
import { Box, Keyboard, Layer, ResponsiveContext } from 'grommet';

import MainViewWrap from './MainViewWrap';
import PanelWrap from './PanelWrap';

import { UserContext } from '../../contexts/UserContext';
import { ISeries } from '../../types';
import Header from '../Header';
import YieldMobileMenu from '../YieldMobileMenu';
import useSeriesEntities from '../../hooks/useSeriesEntities';

interface IModalWrap {
  children: any;
  series?: ISeries | undefined;
}

function ModalWrap({ children, series }: IModalWrap) {
  const router = useRouter();
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    userState: { selectedSeriesId },
  } = useContext(UserContext);

  const { selectedSeries: seriesEntity } = useSeriesEntities(series ? series.id : selectedSeriesId);

  /* LOCAL STATE */
  const [menuLayerOpen, setMenuLayerOpen] = useState<boolean>(false);

  return (
    <Keyboard onEsc={() => router.back()}>
      <Layer
        full
        background={`linear-gradient( 45deg ,  ${seriesEntity?.startColor.toString()} , ${seriesEntity?.endColor
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
          <Box>
            <Header actionList={[() => setMenuLayerOpen(!menuLayerOpen)]} />
            {menuLayerOpen ? <YieldMobileMenu toggleMenu={() => setMenuLayerOpen(!menuLayerOpen)} /> : children}
          </Box>
        )}
      </Layer>
    </Keyboard>
  );
}

ModalWrap.defaultProps = { series: undefined };

export default ModalWrap;

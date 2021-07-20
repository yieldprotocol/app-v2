import React, { useContext } from 'react';
import { Box, Header, Layer, ResponsiveContext } from 'grommet';

import { FiX } from 'react-icons/fi';
import MainViewWrap from './MainViewWrap';
import PanelWrap from './PanelWrap';
import YieldLogo from '../logos/YieldLogo';

interface IModalWrap {
  modalOpen: boolean;
  toggleModalOpen: () => void;
  children: any;
  background?: string | undefined;
}


function ModalWrap({ children, toggleModalOpen, background, modalOpen = false }: IModalWrap) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box>
        {modalOpen && (
          <Layer
            // plain
            onClickOutside={() => toggleModalOpen()}
            responsive
            full
            background={background}
            animation="none"
          >
            <Header
              pad="medium"
              height={mobile ? undefined : 'xsmall'}
              justify="between"
              fill="horizontal"
              style={{ position: 'fixed', top: '0px' }}
            >
              <YieldLogo height={mobile ? '1em' : '1.5em'} startcolor='white' endcolor='red' />
              <FiX onClick={() => toggleModalOpen()} />
            </Header>

            <Box flex={!mobile} overflow="auto" margin={{ top: 'xlarge' }}>
              <MainViewWrap pad="large">
                <PanelWrap>
                  <Box />
                </PanelWrap>
                <Box gap="large" width="600px" pad={{ top: 'large' }}>
                  {/* <BackButton action={() => toggleModalOpen()} /> */}
                  {children}
                </Box>
                <PanelWrap>
                  {' '}
                  <Box />{' '}
                </PanelWrap>
              </MainViewWrap>
            </Box>
          </Layer>
        )}
    </Box>
  );
}

ModalWrap.defaultProps = { background: undefined };

export default ModalWrap;

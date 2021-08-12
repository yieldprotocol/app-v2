import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Avatar, Box, Button, Grid, Header, Layer, ResponsiveContext } from 'grommet';

import { FiX } from 'react-icons/fi';
import MainViewWrap from './MainViewWrap';
import PanelWrap from './PanelWrap';
import YieldLogo from '../logos/YieldLogo';

import { UserContext } from '../../contexts/UserContext';
import YieldMark from '../logos/YieldMark';
import YieldNavigation from '../YieldNavigation';

interface IModalWrap {
  modalOpen: boolean;
  toggleModalOpen: () => void;
  children: any;
  background?: string | undefined;
}

function ModalWrap({ children, toggleModalOpen, background, modalOpen = false }: IModalWrap) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    userState: { selectedSeriesId, seriesMap },
  } = useContext(UserContext);

  const series = seriesMap.get(selectedSeriesId);

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
            pad="large"
            height={mobile ? undefined : 'xsmall'}
            justify="between"
            fill="horizontal"
            style={{ position: 'fixed', top: '0px' }}
          >
            <Grid columns={['medium', 'flex', 'medium']} fill="horizontal">
              <Box direction="row" gap={mobile ? '0.25em' : 'medium'} align="center">
                <Avatar>
                  <NavLink to="/borrow">
                    <YieldMark
                      height={mobile ? '1em' : '2em'}
                      startColor={series?.oppStartColor}
                      endColor={series?.oppEndColor}
                    />
                  </NavLink>
                  <Box />
                </Avatar>
              </Box>
              <Box />

              <Box align="end">
                <Button icon={<FiX onClick={() => toggleModalOpen()} color={series?.oppStartColor} />} />
              </Box>
            </Grid>
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
                <Box />
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

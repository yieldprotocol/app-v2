import React, { useContext } from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Avatar, Box, Button, Grid, Header, Layer, ResponsiveContext } from 'grommet';

import { FiX } from 'react-icons/fi';
import MainViewWrap from './MainViewWrap';
import PanelWrap from './PanelWrap';

import { UserContext } from '../../contexts/UserContext';
import YieldMark from '../logos/YieldMark';
import { useCachedState } from '../../hooks/generalHooks';
import { ISeries } from '../../types';

interface IModalWrap {
  children: any;
  series?: ISeries | undefined;
}

const StyledLayer = styled(Layer)``;

function ModalWrap({ children, series }: IModalWrap) {
  const history = useHistory();
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const prevLoc = useCachedState('lastVisit', '')[0].slice(1).split('/')[0];

  const {
    userState: { selectedSeriesId, seriesMap },
  } = useContext(UserContext);

  const _series = series || seriesMap.get(selectedSeriesId);

  return (
    <StyledLayer onClickOutside={() => history.goBack()} full background={_series?.color} animation="none">
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
                <Avatar>
                  <NavLink to={`/${prevLoc}`}>
                    <YieldMark
                      height={mobile ? '1em' : '2em'}
                      startColor={_series?.oppStartColor}
                      endColor={_series?.oppEndColor}
                    />
                  </NavLink>
                  <Box />
                </Avatar>
              </Box>
              <Box />

              <Box align="end">
                <Button icon={<FiX onClick={() => history.goBack()} color={_series?.oppStartColor} />} />
              </Box>
            </Grid>
          </Header>

          <Box flex={!mobile} overflow="auto" margin={mobile ? {} : { top: 'xlarge' }}>
            <MainViewWrap pad={mobile ? 'medium' : 'large'}>
              <PanelWrap>
                <Box />
              </PanelWrap>
              <Box gap="large" width="600px" pad={{ top: 'large' }}>
                {children}
              </Box>
              <PanelWrap>
                <Box />
              </PanelWrap>
            </MainViewWrap>
          </Box>
        </>
      )}

      {mobile && <Box background="background">{children}</Box>}
    </StyledLayer>
  );
}

ModalWrap.defaultProps = { series: undefined };

export default ModalWrap;

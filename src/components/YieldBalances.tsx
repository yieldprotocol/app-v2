import React, { useContext, useEffect, useState } from 'react';
import { Box, Text } from 'grommet';
import { useLocation } from 'react-router-dom';

import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { WETH } from '../utils/constants';
import Skeleton from './wraps/SkeletonWrap';
import { IAsset } from '../types';

const StyledText = styled(Text)`
  svg,
  span {
    vertical-align: middle;
  }
`;

const Balance = ({ image, balance, loading }: { image: any; balance: string; loading: boolean }) => (
  <Box direction="row" gap="small" align="center">
    <StyledText size="small" color="text">
      {loading && <Skeleton circle height={15} width={15} />}
      {!loading && image}
    </StyledText>
    <StyledText size="small" color="text">
      {loading && <Skeleton width={40} />}
      {!loading && balance}
    </StyledText>
  </Box>
);

const Balances = () => {
  const {
    userState: { selectedBase, selectedIlk, assetsLoading, assetMap },
  } = useContext(UserContext);

  const [baseBalance, setBaseBalance ] = useState<string>(selectedBase?.balance_);
  const [ilkBalance, setIlkBalance ] = useState<string>(selectedIlk?.balance_);
  
  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    selectedBase && setBaseBalance(assetMap.get(selectedBase.id).balance_ ) ;
    selectedIlk && setIlkBalance(assetMap.get(selectedIlk.id).balance_ ) ;
  }, [assetMap, selectedBase, selectedIlk]);

  const { pathname } = useLocation();
  const [path, setPath] = useState<string>();

  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    pathname && setPath(pathname.split('/')[1]);
  }, [pathname]);

  return (
    <Box pad="small" justify="center" align="start">
      <Box>
        <Balance image={selectedBase?.image} balance={baseBalance} loading={assetsLoading} />
        {path === 'borrow' && selectedBase?.id !== selectedIlk?.id && selectedIlk?.idToUse !== WETH && (
          <Balance image={selectedIlk?.image} balance={ilkBalance} loading={assetsLoading} />
        )}
      </Box>
    </Box>
  );
};

export default Balances;

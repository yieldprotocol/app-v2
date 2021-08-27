import React, { useContext, useEffect, useState } from 'react';
import { Box, Collapsible, ResponsiveContext, Text } from 'grommet';
import Skeleton from 'react-loading-skeleton';
import { useLocation } from 'react-router-dom';

import styled from 'styled-components';
import { FiMenu } from 'react-icons/fi';
import { UserContext } from '../contexts/UserContext';
import { WETH } from '../utils/constants';

const StyledText = styled(Text)`
  svg,
  span {
    vertical-align: middle;
  }
`;

const Balance = ({ image, balance, loading }: { image: any; balance: string; loading: boolean }) => (
  <Box direction="row" gap="small" align="center">
    <StyledText size="small" color="text">
      {loading ? <Skeleton circle height={15} width={15} /> : image}
    </StyledText>
    <StyledText size="small" color="text">
      {loading ? <Skeleton width={40} /> : balance}
    </StyledText>
  </Box>
);

const Balances = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    userState: { assetMap, selectedBaseId, selectedIlkId, assetsLoading },
  } = useContext(UserContext);

  const { pathname } = useLocation();
  const [path, setPath] = useState<string>();
  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    pathname && setPath(pathname.split('/')[1]);
  }, [pathname]);

  const [allOpen, setAllOpen] = useState<boolean>(false);

  const selectedBase = assetMap.get(selectedBaseId);
  const selectedIlk = assetMap.get(selectedIlkId);

  return (
    <Box pad="small" justify="center" align="start">
      <Balance image={selectedBase?.image} balance={selectedBase?.balance_} loading={assetsLoading} />
      {path === 'borrow' && selectedBase?.id !== selectedIlk?.id && selectedIlk?.id !== WETH && (
        <Balance image={selectedIlk?.image} balance={selectedIlk?.balance_} loading={assetsLoading} />
      )}
      <Collapsible open={allOpen}>Other balances</Collapsible>
    </Box>
  );
};

export default Balances;

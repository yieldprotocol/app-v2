import React, { useContext, useEffect, useState } from 'react';
import { Box, Collapsible, ResponsiveContext, Text } from 'grommet';
import { useLocation } from 'react-router-dom';

import styled from 'styled-components';
import { FiMenu } from 'react-icons/fi';
import { UserContext } from '../contexts/UserContext';
import { ChainContext } from '../contexts/ChainContext';
import EthMark from './logos/EthMark';
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
      {image}
    </StyledText>
    <StyledText size="small" color="text">
      {balance}
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
  // const ETH = 'WETH';
  // const ethBalance = [...assetMap.keys()].map((x) => assetMap.get(x)).filter((x) => x.symbol === ETH)[0]?.balance_;

  return (
    <Box pad="small" justify="center" align="start">
      <Balance image={selectedBase?.image} balance={selectedBase?.balance_} loading={assetsLoading} />
      {path === 'borrow' && selectedBase?.id !== selectedIlk?.id && selectedIlk?.id !== WETH && (
        <Balance image={selectedIlk?.image} balance={selectedIlk?.balance_} />
      )}
      <Collapsible open={allOpen}>Other balances</Collapsible>
    </Box>
  );
};

export default Balances;

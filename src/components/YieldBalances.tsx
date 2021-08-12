import React, { useContext, useEffect, useState } from 'react';
import { Box, Collapsible, ResponsiveContext, Text } from 'grommet';
import { useLocation } from 'react-router-dom';

import styled from 'styled-components';
import { FiMenu } from 'react-icons/fi';
import { UserContext } from '../contexts/UserContext';
import { ChainContext } from '../contexts/ChainContext';
import EthMark from './logos/EthMark';

const StyledText = styled(Text)`
  svg,
  span {
    vertical-align: middle;
  }
`;

const Balance = ({ image, balance }: { image: any; balance: string }) => (
  <Box direction="row" gap="small" align="center">
    <StyledText size="medium" color="text">
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
    userState: { assetMap, selectedBaseId, selectedIlkId },
  } = useContext(UserContext);

  const { pathname } = useLocation();
  const [path, setPath] = useState<string>();
  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    pathname && setPath(pathname.split('/')[1]);
  }, [pathname]);

  const [allOpen, setAllOpen] = useState<boolean>(false);
  const [ethBalance, setEthBalance] = useState<string>('');

  const selectedBase = assetMap.get(selectedBaseId);
  const selectedIlk = assetMap.get(selectedIlkId);
  const ETH = 'WETH';

  useEffect(() => {
    const eth = [...assetMap.keys()].map((x) => assetMap.get(x)).filter((x) => x.symbol === ETH)[0];
    eth && setEthBalance(eth.balance_);
  }, [ethBalance, assetMap]);

  return (
    <Box direction="row">
      <Box pad="small" justify="center" gap="xxxsmall">
        <Balance image={selectedBase?.image} balance={selectedBase?.balance_} />
        {path === 'borrow' && selectedBase?.id !== selectedIlk?.id && selectedIlk?.symbol !== ETH && (
          <Balance image={selectedIlk?.image} balance={selectedIlk?.balance_} />
        )}

        <Collapsible open={allOpen}>Other balances</Collapsible>
      </Box>
      <Box pad="small" justify="center">
        <Box>
          <Balance image={<EthMark />} balance={ethBalance} />
        </Box>
      </Box>
    </Box>
  );
};

export default Balances;

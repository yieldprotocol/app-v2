import { Box, Collapsible, ResponsiveContext, Text } from 'grommet';
import { useLocation } from 'react-router-dom';

import React, { useContext, useEffect, useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import { UserContext } from '../contexts/UserContext';
import { ChainContext } from '../contexts/ChainContext';
import EthMark from './logos/EthMark';

const Balance = ({ image, balance }: { image: any; balance: string }) => (
  <Box direction="row" gap="small" align="center">
    <Text size="small" color="text">
      {image}
    </Text>
    <Text size="xsmall" color="text">
      {balance}
    </Text>
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

  const selectedBase = assetMap.get(selectedBaseId);
  const selectedIlk = assetMap.get(selectedIlkId);
  const ETH = 'WETH';
  const ethBalance = [...assetMap.keys()].map((x) => assetMap.get(x)).filter((x) => x.symbol === ETH)[0].balance_;

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
        <Balance image={<EthMark />} balance={ethBalance} />
      </Box>
    </Box>
  );
};

export default Balances;

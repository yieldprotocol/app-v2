import { Box, Collapsible, ResponsiveContext, Text } from 'grommet';
import { useLocation } from 'react-router-dom';

import React, { useContext, useEffect, useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';

const Balances = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  const { pathname } = useLocation();
  const [path, setPath] = useState<string>();
  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    pathname && setPath(pathname.split('/')[1]);
  }, [pathname]);

  const [allOpen, setAllOpen] = useState<boolean>(false);

  const { userState: { assetMap, selectedBaseId, selectedIlkId } } = useContext(UserContext);

  const selectedBase = assetMap.get(selectedBaseId);
  const selectedIlk = assetMap.get(selectedIlkId);

  return (

    <Box pad="xsmall" fill="vertical" justify="center">
      <Box direction="row" gap="small">
        <Box> <Text size="small" color="text"> {selectedBase?.symbol}</Text> </Box>
        <Box> <Text size="small" color="text"> {selectedBase?.balance_}</Text></Box>
      </Box>
      {
      path === 'borrow' &&
      selectedBase?.id !== selectedIlk?.id &&
      <Box direction="row" gap="small">
        <Box> <Text size="small" color="text"> {selectedIlk?.symbol}</Text> </Box>
        <Box> <Text size="small" color="text"> {selectedIlk?.balance_}</Text></Box>
      </Box>
      }

      <Collapsible open={allOpen}>

        Other balances
      </Collapsible>
    </Box>

  );
};

export default Balances;

import { Box, Collapsible, ResponsiveContext, Text } from 'grommet';
import { useLocation } from 'react-router-dom';

import React, { useContext, useEffect, useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import { UserContext } from '../contexts/UserContext';

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

  return (
    <Box pad="small" justify="center" gap="xxxsmall" width="5rem">
      <Box direction="row" gap="small" align="center">
        <Text size="small" color="text">
          {selectedBase?.image}
        </Text>
        <Text size="xsmall" color="text">
          {selectedBase?.balance_}
        </Text>
      </Box>
      {path === 'borrow' && selectedBase?.id !== selectedIlk?.id && (
        <Box direction="row" gap="small" align="center">
          <Text size="small" color="text">
            {selectedIlk?.image}
          </Text>
          <Text size="xsmall" color="text">
            {selectedIlk?.balance_}
          </Text>
        </Box>
      )}

      <Collapsible open={allOpen}>Other balances</Collapsible>
    </Box>
  );
};

export default Balances;

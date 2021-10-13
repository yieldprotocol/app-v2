import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';

/* APR hook calculatess APR, min and max aprs for selected series and BORROW or LEND type */
export const useUnsupportedNetwork = () => {
  const {
    chainState: { chainInfo },
  } = useContext(ChainContext);

  const [unsupportedNetwork, setUnsupportedNetwork] = useState<boolean>(false);

  useEffect(() => {
    if (chainInfo) chainInfo.supported ? setUnsupportedNetwork(false) : setUnsupportedNetwork(true);
  }, [chainInfo]);

  return unsupportedNetwork;
};
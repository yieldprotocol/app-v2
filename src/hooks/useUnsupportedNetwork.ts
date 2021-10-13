import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';

/* APR hook calculatess APR, min and max aprs for selected series and BORROW or LEND type */
export const useUnsupportedNetwork = () => {
  const {
    chainState: { currentChainInfo },
  } = useContext(ChainContext);

  const [unsupportedNetwork, setUnsupportedNetwork] = useState<boolean>(false);

  useEffect(() => {
    if (currentChainInfo) currentChainInfo.supported ? setUnsupportedNetwork(false) : setUnsupportedNetwork(true);
  }, [currentChainInfo]);

  return unsupportedNetwork;
};
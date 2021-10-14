import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';

export const useUnsupportedNetwork = () => {
  const {
    chainState: { connection: currentChainInfo },
  } = useContext(ChainContext);

  const [unsupportedNetwork, setUnsupportedNetwork] = useState<boolean>(false);

  useEffect(() => {
    if (currentChainInfo) currentChainInfo.supported ? setUnsupportedNetwork(false) : setUnsupportedNetwork(true);
  }, [currentChainInfo]);

  return unsupportedNetwork;
};

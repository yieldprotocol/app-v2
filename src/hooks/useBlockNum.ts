import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';

/* Simple Hook for caching & retrieved data */
export const useBlockNum = () => {
  const {
    chainState: {
      connection: { provider },
    },
  } = useContext(ChainContext);

  const [blockNum, setBlockNum] = useState<string | null>(null);

  useEffect(() => {
    if (provider) {
      (async () => {
        setBlockNum((await provider.getBlockNumber()).toString());
      })();
    }
  }, [provider]);

  return blockNum;
};

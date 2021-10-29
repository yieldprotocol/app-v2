import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';

/* Simple Hook for caching & retrieved data */
export const useBlockNum = () => {
  const {
    chainState: {
      connection: { fallbackProvider },
    },
  } = useContext(ChainContext);

  const [blockNum, setBlockNum] = useState<string | null>(null);

  useEffect(() => {
    if (fallbackProvider) {
      (async () => {
        setBlockNum((await fallbackProvider.getBlockNumber()).toString());
      })();
    }
  }, [fallbackProvider]);

  return blockNum;
};

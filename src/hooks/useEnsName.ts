import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';

/* Simple Hook for caching & retrieved data */
export const useEnsName = () => {
  const {
    chainState: {
      connection: { account, provider, chainId },
    },
  } = useContext(ChainContext);

  const [ensName, setEnsName] = useState<string | null>(null);

  useEffect(() => {
    if (provider && account && chainId===1) {
      (async () => {
        setEnsName(await provider.lookupAddress(account));
      })();
    }
  }, [account, provider, chainId]);

  return ensName;
};

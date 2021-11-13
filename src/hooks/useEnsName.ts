import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';

export const useEnsName = () => {
  const {
    chainState: {
      connection: { account, provider, chainId },
    },
  } = useContext(ChainContext);

  const [ensName, setEnsName] = useState<string | null>(null);

  useEffect(() => {
    if (provider && account && Number(chainId) === 1) {
      (async () => {
        try {
          setEnsName(await provider.lookupAddress(account));
        } catch (e) {
          console.log(e);
        }
      })();
    }
  }, [account, provider, chainId]);

  return ensName;
};

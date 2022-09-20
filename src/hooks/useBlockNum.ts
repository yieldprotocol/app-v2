import { useContext, useEffect, useState } from 'react';
import { useProvider } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';

export const useBlockNum = () => {

  const provider = useProvider();

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

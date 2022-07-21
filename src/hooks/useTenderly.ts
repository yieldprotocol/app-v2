import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useConnection } from './useConnection';

const useTenderly = () => {
  const {
    connectionState: { useTenderlyFork },
  } = useConnection();

  const [startBlock, setStartBlock] = useState<number>();

  useEffect(() => {
    const getStartBlock = async () => {
      try {
        const tenderlyProvider = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_JSON_RPC_URL);
        const num = await tenderlyProvider.send('tenderly_getForkBlockNumber', []);
        setStartBlock(num);
      } catch (e) {
        console.log('could not get tenderly start block', e);
      }
    };

    if (useTenderlyFork) getStartBlock();
  }, [useTenderlyFork]);

  return { tenderlyStartBlock: startBlock };
};

export default useTenderly;

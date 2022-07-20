import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useConnection } from './useConnection';

const useTenderly = () => {
  const [startBlock, setStartBlock] = useState<number>();
  const {
    connectionState: { useTenderlyFork },
  } = useConnection();

  useEffect(() => {
    const getStartBlock = async () => {
      try {
        const tenderlyProvider = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_JSON_RPC_URL);
        const { number } = await tenderlyProvider.getBlock('fork_root');
        console.log('🦄 ~ file: useTenderly.ts ~ line 19 ~ getStartBlock ~  start', number);
        setStartBlock(number);
      } catch (e) {
        console.log('could not get tenderly start block', e);
      }
    };

    if (useTenderlyFork) getStartBlock();
  }, [useTenderlyFork]);

  return { tenderlyStartBlock: startBlock };
};

export default useTenderly;

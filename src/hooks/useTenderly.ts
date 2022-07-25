import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useConnection } from './useConnection';

const useTenderly = () => {
  const {
    connectionState: { useTenderlyFork, account },
  } = useConnection();

  const [startBlock, setStartBlock] = useState<number>();

  const fillEther = useCallback(async () => {
    console.log(account);
    try {
      const tenderlyProvider = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_JSON_RPC_URL);
      const transactionParameters = [[account], ethers.utils.hexValue(BigInt('100000000000000000000'))];
      await tenderlyProvider?.send('tenderly_addBalance', transactionParameters);
    } catch (e) {
      console.log('could not fill eth on tenderly fork');
    }
  }, [account]);

  useEffect(() => {
    const getStartBlock = async () => {
      try {
        const tenderlyProvider = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_JSON_RPC_URL);
        const num = await tenderlyProvider.send('tenderly_getForkBlockNumber', []);
        setStartBlock(+num.toString());
      } catch (e) {
        console.log('could not get tenderly start block', e);
      }
    };

    if (useTenderlyFork) getStartBlock();
  }, [useTenderlyFork]);

  return { tenderlyStartBlock: startBlock, fillEther };
};

export default useTenderly;

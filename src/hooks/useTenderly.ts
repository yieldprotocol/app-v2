import { ethers } from 'ethers';
import { useContext, useEffect } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { IChainContext } from '../types';

const useTenderly = () => {
  const {
    chainState: {
      connection: { fallbackProvider, account },
    },
  } = useContext(ChainContext) as IChainContext;

  useEffect(() => {
    const fillEther = async (): Promise<void> => {
      const transactionParameters = [[account], ethers.utils.hexValue(100000)];
      await fallbackProvider?.send('tenderly_addBalance', transactionParameters);

      const balance = await fallbackProvider?.getBalance(account);
      console.log('🦄 ~ file: useTenderly.ts ~ line 25 ~ fillEther ~ balance ', balance);
    };

    fillEther();
  }, []);
};

export default useTenderly;

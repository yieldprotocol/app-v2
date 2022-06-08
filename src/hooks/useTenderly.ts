import { ethers } from 'ethers';
import { useCallback, useContext, useEffect } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { IChainContext, ISettingsContext } from '../types';

const useTenderly = () => {
  const {
    chainState: {
      connection: { fallbackProvider, account },
    },
  } = useContext(ChainContext) as IChainContext;

  const {
    settingsState: { useTenderlyFork },
  } = useContext(SettingsContext) as ISettingsContext;

  const fillEther = useCallback(async () => {
    try {
      const tenderlyProvider = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_JSON_RPC_URL);
      const transactionParameters = [[account], ethers.utils.hexValue(10000000000)];
      console.log('🦄 ~ file: useTenderly.ts ~ line 22 ~ fillEther ~ useTenderlyFork', useTenderlyFork);
      await tenderlyProvider?.send('tenderly_addBalance', transactionParameters);
      const balance = await tenderlyProvider?.getBalance(account);
      console.log('🦄 ~ file: useTenderly.ts ~ line 25 ~ fillEther ~ balance ', balance);
    } catch (e) {
      console.log('could not fill eth on tenderly fork');
    }
  }, [account, useTenderlyFork]);

  useEffect(() => {
    fillEther();
  }, [fillEther]);

  return { fillEther };
};

export default useTenderly;

import { ethers } from 'ethers';
import { useContext, useEffect } from 'react';
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

  useEffect(() => {
    const fillEther = async (): Promise<void> => {
      try {
        const transactionParameters = [[account], ethers.utils.hexValue(1000000000000000000)];
        useTenderlyFork && (await fallbackProvider?.send('tenderly_addBalance', transactionParameters));

        const balance = await fallbackProvider?.getBalance(account);
        console.log('🦄 ~ file: useTenderly.ts ~ line 25 ~ fillEther ~ balance ', balance);
      } catch (e) {
        console.log('could not fill eth on tenderly fork');
      }
    };

    fillEther();
  }, [account, fallbackProvider, useTenderlyFork]);
};

export default useTenderly;

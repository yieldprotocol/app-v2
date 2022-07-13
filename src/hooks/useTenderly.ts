import { ethers, providers } from 'ethers';
import { useCallback, useContext, useEffect } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { IChainContext, ISettingsContext } from '../types';

const useTenderly = () => {
  const {
    chainState: {
      connection: {provider, account },
    },
  } = useContext(ChainContext) as IChainContext;

  const {
    settingsState: { useTenderlyFork },
  } = useContext(SettingsContext) as ISettingsContext;

  const fillEther = useCallback(async () => {

    console.log(account)
    try {
      const tenderlyProvider = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_JSON_RPC_URL);
      const transactionParameters = [[account], ethers.utils.hexValue(BigInt('100000000000000000000'))];
      const c = await tenderlyProvider?.send('tenderly_addBalance', transactionParameters);

    } catch (e) {
      console.log('could not fill eth on tenderly fork');
    }
  }, [account]);

  // useEffect(() => {
  //   fillEther();
  // }, [fillEther]);

  return { fillEther };
};

export default useTenderly;

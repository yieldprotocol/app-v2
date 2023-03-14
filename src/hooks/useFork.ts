import { ethers } from 'ethers';
import { useCallback, useContext, useMemo } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import useAccountPlus from './useAccountPlus';
import useSWRImmutable from 'swr/immutable';
import { useBalance } from 'wagmi';
import { toast } from 'react-toastify';

import axios from 'axios';
import useChainId from './useChainId';
import { useNetwork, useProvider } from 'wagmi';

const useFork = () => {
  const {

    settingsState: { useForkedEnv, forkEnvUrl: forkUrl,diagnostics },
  } = useContext(SettingsContext);

  const { address: account } = useAccountPlus();
  const { refetch } = useBalance({ address: account });
  
  const provider = useProvider(); // currently connected provider
  const forkProvider = new ethers.providers.JsonRpcProvider(forkEnvUrl); // fork provider
  
  const chainId = useChainId();
  
  const provider = useMemo(
    () => (useForkedEnv ? new ethers.providers.JsonRpcProvider(forkUrl) : undefined),
    [forkUrl, useForkedEnv]
  );
  
    const createNewFork = async (): Promise<string> => {
    const TENDERLY_FORK_API = `http://api.tenderly.co/api/v1/account/${process.env.TENDERLY_USER}/project/${process.env.TENDERLY_PROJECT}/fork`;
    const currentBlockNumber = await provider.getBlockNumber();
    const resp = await axios.post(
      TENDERLY_FORK_API,
      { network_id: chainId.toString(), block_number: currentBlockNumber },
      {
        headers: {
          'X-Access-Key': process.env.TENDERLY_ACCESS_KEY as string,
        },
      }
    );
    return `https://rpc.tenderly.co/fork/${resp.data.simulation_fork.id}`;
  };
  

  const getForkTimestamp = useCallback(async () => {
    if (!useForkedEnv || !provider) return;
    
    try {
      const { timestamp } = await provider.getBlock('latest');
      console.log('Updated Forked Blockchain time: ', new Date(timestamp * 1000));
      return timestamp;
    } catch (e) {
      console.log('Error getting latest timestamp', e);
      return undefined;
    }
  }, [provider, useForkedEnv]);

  const getForkStartBlock = useCallback(async () => {
    if (!useForkedEnv || !provider) return 'earliest';

    try {

      const num = await provider.send('tenderly_getForkBlockNumber', []);
      const sBlock = +num.toString();
      console.log('Fork start block: ', sBlock);
      return sBlock;

/** from createFork
      //const { timestamp } = await forkProvider.getBlock('latest');
      //diagnostics && useForkedEnv && console.log('Updated Forked Blockchain time: ', new Date(timestamp * 1000));
      //setForkTimestamp(timestamp);
      //return timestamp;
      */


    } catch (e) {
      console.log('Could not get tenderly start block: ', e);
      return 'earliest';
    }
  }, [provider, useForkedEnv]);

  const fillEther = useCallback(async () => {
    if (!provider || !useForkedEnv) return;

    try {
      const transactionParameters = [[account], ethers.utils.hexValue(BigInt('100000000000000000000'))];
      await provider.send('tenderly_addBalance', transactionParameters);
      refetch();
      toast.success('Filled eth on fork');
    } catch (e) {
      console.log('Could not fill eth on Tenderly fork');
    }
  }, [account, provider, refetch, useForkedEnv]);

  const { data: forkTimestamp } = useSWRImmutable(useForkedEnv ? ['forkTimestamp', forkUrl] : null, getForkTimestamp); // don't run if not using forked env
  const { data: forkStartBlock } = useSWRImmutable(
    useForkedEnv ? ['forkStartBlock', forkUrl] : null,
    getForkStartBlock
  ); // don't run if not using forked env

  return {
    useForkedEnv,
    getForkStartBlock,
    fillEther,
    forkUrl,
    getForkTimestamp,
    forkTimestamp,
    forkStartBlock,
    createNewFork,

  };
};

export default useFork;


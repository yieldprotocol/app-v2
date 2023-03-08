import { ethers } from 'ethers';
import { useCallback, useContext, useEffect, useState } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import useAccountPlus from './useAccountPlus';

import axios from 'axios';
import useChainId from './useChainId';
import { useNetwork, useProvider } from 'wagmi';

const useFork = () => {
  const {
    settingsState: { useForkedEnv, forkEnvUrl, diagnostics },
  } = useContext(SettingsContext);

  const { address: account } = useAccountPlus();
  const provider = useProvider(); // currently connected provider
  const forkProvider = new ethers.providers.JsonRpcProvider(forkEnvUrl); // fork provider
  
  const chainId = useChainId();

  /* From settings */
  const [forkUrl, setForkUrl] = useState<string>(forkEnvUrl);

  const [forkStartBlock, setForkStartBlock] = useState<number>();
  const [forkTimestamp, setForkTimestamp] = useState<number>();

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

  const getForkStartBlock = async () => {
    try {
      const num = await (forkProvider as any).send('tenderly_getForkBlockNumber', []);
      const sBlock = +num.toString();
      setForkStartBlock(sBlock);
      console.log('Fork start block: ', sBlock);
      return sBlock;
    } catch (e) {
      console.log('Could not get tenderly start block: ', e);
      setForkStartBlock(undefined);
      return 0;
    }
  };

  const getForkTimestamp = async () => {
    try {
      const { timestamp } = await forkProvider.getBlock('latest');
      diagnostics && useForkedEnv && console.log('Updated Forked Blockchain time: ', new Date(timestamp * 1000));
      setForkTimestamp(timestamp);
      return timestamp;
    } catch (e) {
      console.log('Error getting latest timestamp', e);
      setForkTimestamp(undefined);
      // return timestamp;
    }
  };

  const fillEther = useCallback(async () => {
    try {
      const transactionParameters = [[account], ethers.utils.hexValue(BigInt('100000000000000000000'))];
      await (forkProvider as any).send('tenderly_addBalance', transactionParameters);
    } catch (e) {
      console.log('Could not fill eth on Tenderly fork');
    }
  }, [account]);

  useEffect(() => {
    useForkedEnv && setForkUrl(forkEnvUrl);
  }, [useForkedEnv, forkEnvUrl]);

  useEffect(() => {
    if (useForkedEnv && forkEnvUrl) {
      getForkTimestamp();
      getForkStartBlock();
    }
  }, [useForkedEnv, forkEnvUrl]);

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


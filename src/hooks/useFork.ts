import { ethers } from 'ethers';
import { useCallback, useContext, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { SettingsContext } from '../contexts/SettingsContext';
import useSWRImmutable from 'swr/immutable';

const useFork = () => {
  const {
    settingsState: { useForkedEnv, forkRpcUrl: forkUrl },
  } = useContext(SettingsContext);

  const { address: account } = useAccount();
  const provider = useMemo(() => new ethers.providers.JsonRpcProvider(forkUrl), [forkUrl]);

  const getForkStartBlock = useCallback(async () => {
    try {
      const num = await provider.send('tenderly_getForkBlockNumber', []);
      const sBlock = +num.toString();
      console.log('Fork start block: ', sBlock);
      return sBlock;
    } catch (e) {
      console.log('Could not get tenderly start block: ', e);
      return 0;
    }
  }, [provider]);

  const getForkTimestamp = useCallback(async () => {
    try {
      const { timestamp } = await provider.getBlock('latest');
      useForkedEnv && console.log('Updated Forked Blockchain time: ', new Date(timestamp * 1000));
      return timestamp;
    } catch (e) {
      console.log('Error getting latest timestamp', e);
    }
  }, [provider, useForkedEnv]);

  const fillEther = useCallback(async () => {
    try {
      const transactionParameters = [[account], ethers.utils.hexValue(BigInt('100000000000000000000'))];
      await (provider as any).send('tenderly_addBalance', transactionParameters);
    } catch (e) {
      console.log('Could not fill eth on Tenderly fork');
    }
  }, [account, provider]);

  const { data: forkTimestamp } = useSWRImmutable(useForkedEnv ? 'forkTimestamp' : null, getForkTimestamp);
  const { data: forkStartBlock } = useSWRImmutable(useForkedEnv ? 'forkStartBlock' : null, getForkStartBlock);

  return {
    isFork: useForkedEnv,
    getForkStartBlock,
    fillEther,
    forkUrl,
    getForkTimestamp,
    forkTimestamp,
    forkStartBlock,
  };
};

export default useFork;

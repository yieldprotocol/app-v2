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
  const provider = useMemo(
    () => (useForkedEnv ? new ethers.providers.JsonRpcProvider(forkUrl) : undefined),
    [forkUrl, useForkedEnv]
  );

  const getForkTimestamp = useCallback(async () => {
    if (!provider) return undefined;

    try {
      const { timestamp } = await provider.getBlock('latest');
      useForkedEnv && console.log('Updated Forked Blockchain time: ', new Date(timestamp * 1000));
      return timestamp;
    } catch (e) {
      console.log('Error getting latest timestamp', e);
      return undefined;
    }
  }, [provider, useForkedEnv]);

  const fillEther = useCallback(async () => {
    if (!provider) return;

    if (useForkedEnv) {
      try {
        const transactionParameters = [[account], ethers.utils.hexValue(BigInt('100000000000000000000'))];
        await provider.send('tenderly_addBalance', transactionParameters);
      } catch (e) {
        console.log('Could not fill eth on Tenderly fork');
      }
    }
  }, [account, provider, useForkedEnv]);

  const { data: forkTimestamp } = useSWRImmutable(useForkedEnv ? 'forkTimestamp' : null, getForkTimestamp);

  return {
    isFork: useForkedEnv,
    fillEther,
    forkUrl,
    getForkTimestamp,
    forkTimestamp,
  };
};

export default useFork;

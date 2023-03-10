import { ethers } from 'ethers';
import { useCallback, useContext, useMemo } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import useAccountPlus from './useAccountPlus';
import useSWRImmutable from 'swr/immutable';

const useFork = () => {
  const {
    settingsState: { useForkedEnv, forkEnvUrl: forkUrl },
  } = useContext(SettingsContext);

  const { address: account } = useAccountPlus();
  const provider = useMemo(
    () => (useForkedEnv ? new ethers.providers.JsonRpcProvider(forkUrl) : undefined),
    [forkUrl, useForkedEnv]
  );

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
    if (!useForkedEnv || !provider) return;

    try {
      const num = await provider.send('tenderly_getForkBlockNumber', []);
      const sBlock = +num.toString();
      console.log('Fork start block: ', sBlock);
      return sBlock;
    } catch (e) {
      console.log('Could not get tenderly start block: ', e);
      return 'earliest';
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

  const { data: forkTimestamp } = useSWRImmutable(useForkedEnv ? ['forkTimestamp', forkUrl] : null, getForkTimestamp); // don't run if not using forked env
  const { data: forkStartBlock } = useSWRImmutable(
    useForkedEnv ? ['forkStartBlock', forkUrl] : null,
    getForkStartBlock
  ); // don't run if not using forked env

  return {
    fillEther,
    forkUrl,
    getForkTimestamp,
    forkTimestamp,
    provider,
    useForkedEnv,
    forkStartBlock,
  };
};

export default useFork;

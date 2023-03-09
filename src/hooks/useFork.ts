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

  const getForkStartBlock = useCallback(async () => {
    if (!provider) return;
    try {
      const num = await (provider as any).send('tenderly_getForkBlockNumber', []);
      const sBlock = +num.toString();
      console.log('Fork start block: ', sBlock);
      return sBlock;
    } catch (e) {
      console.log('Could not get tenderly start block: ', e);
      return 0;
    }
  }, [provider]);

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

  const { data: forkTimestamp } = useSWRImmutable(useForkedEnv ? ['forkTimestamp', forkUrl] : null, getForkTimestamp);
  const { data: forkStartBlock } = useSWRImmutable(
    useForkedEnv ? ['forkStartBlock', forkUrl] : null,
    getForkStartBlock
  );

  return {
    fillEther,
    forkUrl,
    getForkTimestamp,
    forkTimestamp,
    forkStartBlock,
    useForkedEnv,
  };
};

export default useFork;

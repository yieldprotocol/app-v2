import { ethers } from 'ethers';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAccount} from 'wagmi';
import { SettingsContext } from '../contexts/SettingsContext';

const useFork = () => {
  const {
    settingsState: { useForkedEnv, forkEnvUrl },
  } = useContext(SettingsContext);

  const { address: account } = useAccount();
  const provider = new ethers.providers.JsonRpcProvider(forkEnvUrl);

  /* From settings */
  const [forkUrl, setForkUrl] = useState<string>(forkEnvUrl);
  const [isFork, setIsFork] = useState<boolean>(useForkedEnv);

  const [forkStartBlock, setForkStartBlock] = useState<number>();
  const [forkTimestamp, setForkTimestamp] = useState<number>();

  const getForkStartBlock = async () => {
    try {
      const num = await (provider as any).send('tenderly_getForkBlockNumber', []);
      const sBlock = +num.toString();
      // setForkStartBlock(sBlock);
      console.log('Fork start block: ', sBlock);
      return sBlock;
    } catch (e) {
      console.log('Could not get tenderly start block: ', e);
      // setForkStartBlock(undefined);
      return 0;
    }
  };

  const getForkTimestamp = async () => {
    try {
      const { timestamp } = await provider.getBlock('latest');
      useForkedEnv && console.log( 'Updated Forked Blockchain time: ', new Date(timestamp*1000))
      // setForkTimestamp(timestamp);
      return timestamp
    } catch (e) {
      console.log('Error getting latest timestamp', e);
      // setForkTimestamp(undefined);
      // return timestamp;
    }
  };
  
  const fillEther = useCallback(async () => {
    try {
      const transactionParameters = [[account], ethers.utils.hexValue(BigInt('100000000000000000000'))];
      await (provider as any).send('tenderly_addBalance', transactionParameters);
    } catch (e) {
      console.log('Could not fill eth on Tenderly fork');
    }
  }, [account]);

  useEffect(()=>{
    setIsFork(useForkedEnv);
    setForkUrl(forkEnvUrl);
  },[useForkedEnv, forkEnvUrl])

  useEffect(()=>{
    if (useForkedEnv && forkEnvUrl) {
      getForkTimestamp();
      getForkStartBlock();
    }
  },[])

  return { isFork, getForkStartBlock, fillEther, forkUrl, getForkTimestamp, forkTimestamp, forkStartBlock };
};

export default useFork;

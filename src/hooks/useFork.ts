import { ethers } from 'ethers';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAccount, useProvider } from 'wagmi';
import { SettingsContext } from '../contexts/SettingsContext';

const useFork = () => {
  const {
    settingsState: { useForkedEnv, forkRpcUrl },
  } = useContext(SettingsContext);
  const { address: account } = useAccount();
  const provider = new ethers.providers.JsonRpcProvider(forkRpcUrl);

  const [startBlock, setStartBlock] = useState<number>();

  useEffect(()=>{
    startBlock && console.log('fork start block: ',  startBlock)
  }, [startBlock])

  const fillEther = useCallback(async () => {
    try {
      const transactionParameters = [[account], ethers.utils.hexValue(BigInt('100000000000000000000'))];
      await (provider as any).send('tenderly_addBalance', transactionParameters);
    } catch (e) {
      console.log('Could not fill eth on Tenderly fork');
    }
  }, [account]);

  useEffect(() => {
    const getStartBlock = async () => {
      try {
        const num = await (provider as any).send('tenderly_getForkBlockNumber', []);
        setStartBlock(+num.toString());
      } catch (e) {
        console.log('Could not get tenderly start block', e);
        return 0;
      }
    };
    if (useForkedEnv) getStartBlock();
  }, [useForkedEnv]);

  return {startBlock, fillEther };
};

export default useFork;

import { ethers } from 'ethers';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAccount, useProvider } from 'wagmi';
import { SettingsContext } from '../contexts/SettingsContext';

const useFork = () => {
  const {
    settingsState: { useForkedEnv },
  } = useContext(SettingsContext);
  const { address: account } = useAccount();
  const provider = useProvider();

  const [startBlock, setStartBlock] = useState<number>();

  // const tenderlyProvider = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_JSON_RPC_URL);

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

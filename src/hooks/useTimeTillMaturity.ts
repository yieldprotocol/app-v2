import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useProvider } from 'wagmi';
import { SettingsContext } from '../contexts/SettingsContext';
import useFork from './useFork';

const useTimeTillMaturity = (useBlockchainTime = false) => {
  
  const { isFork, forkTimestamp } = useFork();

  const NOW = useMemo(() => Math.round(new Date().getTime() / 1000), []);

  const getTimeTillMaturity = useCallback(
   (maturity: number) =>  {
      if (isFork && forkTimestamp) return (maturity - forkTimestamp).toString();
      return (maturity - NOW).toString();
    },
    [NOW, isFork]
  );

  const isMature = useCallback(
    (maturity: number) => {
      if (isFork && forkTimestamp) return maturity - forkTimestamp <= 0;
      return maturity - NOW <= 0;
    },
    [NOW, isFork]
  );

  // // try to get the latest block timestamp when we are using forked env ( eg. tenderly ), or when explicitly requested
  // useEffect(() => {
  //   const getBlockTimestamp = async () => {
  //     try {
  //       // const tenderlyProvider = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_JSON_RPC_URL);
  //       const { timestamp } = await provider.getBlock('latest');
  //       useForkedEnv && console.log( 'Forked Blockchain time: ', new Date(timestamp*1000).toLocaleDateString())
  //       setBlockTimestamp(timestamp);
  //     } catch (e) {
  //       console.log('Error getting latest timestamp', e);
  //     }
  //   };
  //   if (useForkedEnv || useBlockchainTime) getBlockTimestamp();
  // }, [useForkedEnv, useBlockchainTime]);

  return { getTimeTillMaturity, isMature };
};

export default useTimeTillMaturity;
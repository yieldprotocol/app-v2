// import { ethers } from 'ethers';

// import { useCallback, useContext, useEffect, useState, useMemo } from 'react';
// import { useAccount} from 'wagmi';
// import { SettingsContext } from '../contexts/SettingsContext';
// import useAccountPlus from './useAccountPlus';
// import useSWRImmutable from 'swr/immutable';

// /** master code */

// const useFork = () => {
//   const {
//     settingsState: { useForkedEnv, forkEnvUrl: forkUrl },
//   } = useContext(SettingsContext);

//   const { address: account } = useAccount();
//   const provider = useMemo(
//     () => (useForkedEnv ? new ethers.providers.JsonRpcProvider(forkUrl) : undefined),
//     [forkUrl, useForkedEnv]
//   );

//   const getForkTimestamp = useCallback(async () => {
//     if (!provider) return undefined;

//         try {
//       const { timestamp } = await provider.getBlock('latest');
//       useForkedEnv && console.log('Updated Forked Blockchain time: ', new Date(timestamp * 1000));
//       return timestamp;
//     } catch (e) {
//       console.log('Error getting latest timestamp', e);
//       return undefined;
//     }
//   }, [provider, useForkedEnv]);

//   const fillEther = useCallback(async () => {
//     if (!provider) return;

//     if (useForkedEnv) {
//       try {
//         const transactionParameters = [[account], ethers.utils.hexValue(BigInt('100000000000000000000'))];
//         await provider.send('tenderly_addBalance', transactionParameters);
//       } catch (e) {
//         console.log('Could not fill eth on Tenderly fork');
//       }
//     }
//   }, [account, provider, useForkedEnv]);

//   const { data: forkTimestamp } = useSWRImmutable(useForkedEnv ? 'forkTimestamp' : null, getForkTimestamp);

//   return {
//     fillEther,
//     forkUrl,
//     getForkTimestamp,
//     forkTimestamp,
//   };

// /** master code */

// };

// export default useFork;

import { ethers } from 'ethers';
import { useCallback, useContext, useEffect, useState } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import useAccountPlus from './useAccountPlus';

import axios from 'axios';
import useChainId from './useChainId';

const useFork = () => {
  const {
    settingsState: { useForkedEnv, forkEnvUrl },
  } = useContext(SettingsContext);

  const { address: account } = useAccountPlus();
  const provider = new ethers.providers.JsonRpcProvider(forkEnvUrl);
  const chainId = useChainId();

  /* From settings */
  const [forkUrl, setForkUrl] = useState<string>(forkEnvUrl);

  const [forkStartBlock, setForkStartBlock] = useState<number>();
  const [forkTimestamp, setForkTimestamp] = useState<number>();

  const createNewFork = async () => {

    console.log(process.env.TENDERLY_PROJECT, process.env.TENDERLY_USER )

    // const TENDERLY_FORK_API = `https://tenderly.co/api/v2/project/${process.env.TENDERLY_PROJECT}/forks`;
    const TENDERLY_FORK_API = `http://api.tenderly.co/api/v1/account/me/project/yield_v2/fork`;

    console.log( TENDERLY_FORK_API  )

    const resp = await axios.post(
      TENDERLY_FORK_API,
      { network_id: "1", block_number: 16776329 },
      {
        headers: {
          'X-Access-Key': process.env.TENDERLY_ACCESS_KEY as string,
        },
      }
    );

    console.log(resp);
    return resp;
  };


  const getForkStartBlock = async () => {
    try {
      const num = await (provider as any).send('tenderly_getForkBlockNumber', []);
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
      const { timestamp } = await provider.getBlock('latest');
      useForkedEnv && console.log('Updated Forked Blockchain time: ', new Date(timestamp * 1000));
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
      await (provider as any).send('tenderly_addBalance', transactionParameters);
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


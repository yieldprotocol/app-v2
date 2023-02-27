import { Contract } from 'ethers';
import { useMemo } from 'react';
import yieldEnv from './../contexts/yieldEnv.json';
import * as contractTypes from '../contracts';
import useChainId from './useChainId';
import { useProvider } from 'wagmi';

export enum ContractNames {
  CAULDRON = 'Cauldron',
  WITCH = 'Witch',
  WITCHV2 = 'WitchV2',
  LADLE = 'Ladle',
  WRAP_ETHER_MODULE = 'WrapEtherModule',
  CONVEX_LADLE_MODULE = 'ConvexLadleModule',
  ASSERT = 'Assert'
}

const useContracts = () => {
  const { addresses } = yieldEnv;
  const chainId = useChainId();
  const provider = useProvider();
  const chainAddrs = (addresses as any)[chainId];  
  return useMemo(() => {
    return Object.keys(chainAddrs).reduce((contracts, name: string) => {
      const contract = (contractTypes as any)[`${name}__factory`].connect(chainAddrs[name], provider) as Contract;
      return contracts.set(name, contract);
    }, new Map() as Map<string, Contract>);
  }, [chainAddrs, provider]);
};

export default useContracts;

import { Contract } from 'ethers';
import { useMemo } from 'react';
import yieldEnv from './../contexts/yieldEnv.json';
import * as contractTypes from '../contracts';
import useChainId from './useChainId';
import useDefaultProvider from './useDefaultProvider';

const useContracts = () => {
  const { addresses } = yieldEnv;
  const chainId = useChainId();
  const provider = useDefaultProvider();
  const chainAddrs = addresses[chainId];

  return useMemo(() => {
    return Object.keys(chainAddrs).reduce((contracts, name: string) => {
      console.log('🦄 ~ file: useContracts.ts ~ line 16 ~ returnObject.keys ~ name', name);
      const contract = contractTypes[`${name}__factory`].connect(chainAddrs[name], provider) as Contract;
      return contracts.set(name, contract);
    }, new Map() as Map<string, Contract>);
  }, [chainAddrs, provider]);
};

export default useContracts;

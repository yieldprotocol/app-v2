import { useMemo } from 'react';
import yieldEnv, { ContractMap, ContractNames } from '../contexts/yieldEnv';
import * as contractTypes from '../contracts';
import useChainId from './useChainId';
import { useProvider } from 'wagmi';
import { Contract } from 'ethers';

const useContracts = () => {
  const { addresses } = yieldEnv;
  const chainId = useChainId();
  const provider = useProvider();
  const chainAddrs = addresses.get(chainId);

  return useMemo(() => {
    if (!chainAddrs) return;

    return [...chainAddrs.keys()].reduce((contracts, name) => {
      const contract = (contractTypes as any)[`${name}__factory`].connect(chainAddrs.get(name), provider) as Contract;
      return contracts.set(name, contract);
    }, new Map() as ContractMap);
  }, [chainAddrs, provider]);
};

export default useContracts;

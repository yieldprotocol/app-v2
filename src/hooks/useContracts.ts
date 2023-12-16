import { useMemo } from 'react';
import contractAddresses, { ContractMap } from '../config/contracts';
import * as contractTypes from '../contracts';
import { useNetwork } from 'wagmi';
import { Contract } from 'ethers';
import { useEthersProvider } from './useEthersProvider';

const useContracts = () => {
  const { addresses } = contractAddresses;
  const {chain} = useNetwork();
  const provider = useEthersProvider();
  const chainAddrs = addresses.get(chain?.id || 1);

  return useMemo(() => {
    if (!chainAddrs || !chain) return;
    return [...chainAddrs.keys()].reduce((contracts, name) => {
      const contract = (contractTypes as any)[`${name}__factory`].connect(chainAddrs.get(name), provider) as Contract;
      return contracts.set(name, contract);
    }, new Map() as ContractMap);
  }, [chainAddrs, provider]);
};

export default useContracts;

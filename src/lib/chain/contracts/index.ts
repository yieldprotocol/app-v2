import { Contract, ethers } from 'ethers';
import yieldEnv from '../../../contexts/yieldEnv.json';
import * as contractTypes from '../../../contracts';
import { CONTRACTS_TO_FETCH_SSR } from '../../../utils/constants';

export const getContracts = (
  provider: ethers.providers.JsonRpcProvider,
  chainId: number
): Map<string, Contract> | undefined => {
  const addrs = yieldEnv.addresses[chainId];

  if (!addrs) return undefined;

  return Object.keys(addrs).reduce((contracts: Map<string, Contract>, name: string) => {
    try {
      if (CONTRACTS_TO_FETCH_SSR.includes(name)) {
        const contract = contractTypes[`${name}__factory`].connect(addrs[name], provider) as Contract;
        return contracts.set(name, contract);
      }
      return contracts;
    } catch (e) {
      console.log(`could not connect directly to contract ${name}`);
      return contracts;
    }
  }, new Map());
};

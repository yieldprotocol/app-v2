import { useNetwork } from 'wagmi';

/**
 * Uses the connected chain or the default network, to only be used when fetching data
 * @returns chain id to use when fetching data
 */
const useChainId = () => {
  const DEFAULT_CHAIN_ID = 1;
  const { chain } = useNetwork();
  return chain ? chain.id : DEFAULT_CHAIN_ID;
};

export default useChainId;

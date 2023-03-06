import { useMemo } from 'react';
import useChainId from './useChainId';

const useSubgraph = () => {
  const SUBGRAPH_BASE = 'https://api.thegraph.com/subgraphs/name/yieldprotocol/';
  const SUBGRAPHS = useMemo(
    () =>
      new Map<number, string>([
        [1, `${SUBGRAPH_BASE}v2-mainnet`],
        [42161, `${SUBGRAPH_BASE}v2-arbitrum`],
      ]),
    []
  );
  const chainId = useChainId();
  const subgraphUrl = useMemo(() => {
    const subgraphUrl = SUBGRAPHS.get(chainId);
    if (!subgraphUrl) {
      throw new Error(`No subgraph url found for chainId ${chainId}`);
    }
    return subgraphUrl;
  }, [SUBGRAPHS, chainId]);

  return { subgraphUrl };
};

export default useSubgraph;

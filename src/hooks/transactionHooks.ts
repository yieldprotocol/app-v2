import { useContext, useEffect, useState, useRef } from 'react';
import { ChainContext } from '../contexts/ChainContext';

import * as contractFactories from '../contracts';

/* Generic hook for chain transactions */
export const useChainTx = (contractName:string, fnName:string, args:any[]) => {
  const { chainState } = useContext(ChainContext);
};

/* Simple Hook for caching & retrieved data */
export const useChainCall = (contractName:string, fnName:string, args:any[]) => {
  const { chainState } = useContext(ChainContext);
  const [contract, setContract] = useState<any>();
};

import { useCallback, useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { IChainContext } from '../types';

const useTimeTillMaturity = (useBlockchainTime = false) => {
  const {
    chainState: {
      connection: { fallbackProvider, useTenderlyFork },
    },
  } = useContext(ChainContext) as IChainContext;

  // block timestamp from network
  const [blockTimestamp, setBlockTimestamp] = useState<number>();

  const NOW = Math.round(new Date().getTime() / 1000);

  const getTimeTillMaturity = useCallback(
    (maturity: number) => (blockTimestamp ? maturity - blockTimestamp : maturity - NOW).toString(),
    [NOW, blockTimestamp]
  );

  const isMature = useCallback(
    (maturity: number) => (blockTimestamp ? maturity - blockTimestamp >= 0 : maturity - NOW >= 0),
    [NOW, blockTimestamp]
  );

  // try to get the latest block timestamp when we are using tenderly, or when explicitly requested
  useEffect(() => {
    const getBlockTimestamp = async () => {
      if (useTenderlyFork || useBlockchainTime) {
        try {
          setBlockTimestamp((await fallbackProvider.getBlock('latest')).timestamp);
        } catch (e) {
          console.log('error getting latest timestamp', e);
        }
      }
    };

    getBlockTimestamp();
  }, [useBlockchainTime, useTenderlyFork]); // intentionally ommitting fallbackProvider to prevents too many re-renders

  return { getTimeTillMaturity, isMature };
};

export default useTimeTillMaturity;

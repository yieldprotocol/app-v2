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
    (maturity: number) => (blockTimestamp ? maturity - blockTimestamp <= 0 : maturity - NOW <= 0),
    [NOW, blockTimestamp]
  );

  // try to get the latest block timestamp when we are using tenderly, or when explicitly requested
  useEffect(() => {
    const getBlockTimestamp = async () => {
      try {
        const { timestamp } = await fallbackProvider.getBlock('latest');
        setBlockTimestamp(timestamp);
      } catch (e) {
        console.log('error getting latest timestamp', e);
      }
    };

    if (useTenderlyFork || useBlockchainTime) getBlockTimestamp();
  }, [useBlockchainTime, useTenderlyFork]); // intentionally ommitting fallbackProvider to prevent too many re-renders

  useEffect(() => {
    console.log('🦄 ~ file: useTimeTillMaturity.ts ~ line 42 ~ useTimeTillMaturity ~ blockTimestamp', blockTimestamp);
  }, [blockTimestamp, useBlockchainTime, useTenderlyFork]);

  return { getTimeTillMaturity, isMature };
};

export default useTimeTillMaturity;

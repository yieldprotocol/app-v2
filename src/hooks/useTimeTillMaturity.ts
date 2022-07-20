import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { IChainContext, ISeries, ISettingsContext } from '../types';

const useTimeTillMaturity = (series: ISeries, useBlockchainTime = false) => {
  const {
    chainState: {
      connection: { fallbackProvider },
    },
  } = useContext(ChainContext) as IChainContext;

  const {
    settingsState: { useTenderlyFork },
  } = useContext(SettingsContext) as ISettingsContext;

  // block timestamp from network
  const [blockTimestamp, setBlockTimestamp] = useState<number>();
  const NOW = Math.round(new Date().getTime() / 1000);

  const getTimeTillMaturity = () => (blockTimestamp ? series.maturity - blockTimestamp : series.maturity - NOW);

  const isMature = () => (blockTimestamp ? series.maturity - blockTimestamp >= 0 : series.maturity - NOW >= 0);

  // try to get the latest block timestamp when we are using tenderly, or when explicitly requested
  useEffect(() => {
    if (useTenderlyFork || useBlockchainTime) {
      (async () => {
        try {
          const latestTimestamp = (await fallbackProvider.getBlock('latest')).timestamp;
          console.log('🦄 ~ file: useTimeTillMaturity.ts ~ line 30 ~ latestTimestamp ', latestTimestamp);
          setBlockTimestamp(latestTimestamp);
        } catch (e) {
          console.log('error getting latest timestamp', e);
        }
      })();
    }
  }, [fallbackProvider, useBlockchainTime, useTenderlyFork]);

  return { getTimeTillMaturity, isMature };
};

export default useTimeTillMaturity;

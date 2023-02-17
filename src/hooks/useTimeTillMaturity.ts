import { useCallback, useMemo } from 'react';
import useFork from './useFork';

const useTimeTillMaturity = (useBlockchainTime = false) => {
  const { isFork, forkTimestamp } = useFork();

  const NOW = useMemo(() => Math.round(new Date().getTime() / 1000), []);

  const getTimeTillMaturity = useCallback(
    (maturity: number) => {
      if (isFork && forkTimestamp) return (maturity - forkTimestamp).toString();
      return (maturity - NOW).toString();
    },
    [NOW, forkTimestamp, isFork]
  );

  const isMature = useCallback(
    (maturity: number) => {
      if (isFork && forkTimestamp) return maturity - forkTimestamp <= 0;
      return maturity - NOW <= 0;
    },
    [NOW, forkTimestamp, isFork]
  );

  return { getTimeTillMaturity, isMature };
};

export default useTimeTillMaturity;

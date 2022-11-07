import { ethers } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';

const useTimeTillMaturity = (useBlockchainTime = false) => {
  // const {
  //   settingState: {useTenderlyFork},
  // } = useContext(SettingsContext)

  const useTenderlyFork = false;

  // block timestamp from network
  const [blockTimestamp, setBlockTimestamp] = useState<number>();

  const NOW = useMemo(() => Math.round(new Date().getTime() / 1000), []);

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
        const tenderlyProvider = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_JSON_RPC_URL);
        const { timestamp } = await tenderlyProvider.getBlock('latest');
        setBlockTimestamp(timestamp);
      } catch (e) {
        console.log('error getting latest tenderly timestamp', e);
      }
    };

    if (useTenderlyFork || useBlockchainTime) getBlockTimestamp();
  }, [useTenderlyFork, useBlockchainTime]);

  return { getTimeTillMaturity, isMature };
};

export default useTimeTillMaturity;

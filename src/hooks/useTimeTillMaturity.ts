import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useProvider } from 'wagmi';
import { SettingsContext } from '../contexts/SettingsContext';

const useTimeTillMaturity = (useBlockchainTime = false) => {
  const {
    settingsState: { useForkedEnv },
  } = useContext(SettingsContext)

  const provider = useProvider();

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

  // try to get the latest block timestamp when we are using forked env ( eg. tenderly ), or when explicitly requested
  useEffect(() => {
    const getBlockTimestamp = async () => {
      try {
        // const tenderlyProvider = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_JSON_RPC_URL);
        const { timestamp } = await provider.getBlock('latest');

        useForkedEnv && console.log( 'Forked Blockchain time: ', new Date(timestamp*1000).toLocaleDateString())
        setBlockTimestamp(timestamp);
      } catch (e) {
        console.log('Error getting latest timestamp', e);
      }
    };
    if (useForkedEnv || useBlockchainTime) getBlockTimestamp();
  }, [useForkedEnv, useBlockchainTime]);

  return { getTimeTillMaturity, isMature };
};

export default useTimeTillMaturity;
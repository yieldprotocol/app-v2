import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useContext, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount, useProvider } from 'wagmi';
import { Pool__factory, Strategy__factory } from '../contracts';
import { IStrategy } from '../types';
import useChainId from './useChainId';
import yieldEnv from '../contexts/yieldEnv.json';
import { ChainContext } from '../contexts/ChainContext';

/**
 * Fetch all strategy data
 */
const useStrategies = () => {
  const {
    chainState: { multicall },
  } = useContext(ChainContext);
  const provider = useProvider();
  const chainId = useChainId();
  const { address: account } = useAccount();

  const getStrategies = async () => {
    if (!multicall) return;
    console.log('fetching strategies');

    const strategyList: string[] = (yieldEnv.strategies as any)[chainId];

    return strategyList.reduce(async (acc, addr) => {
      const contract = Strategy__factory.connect(addr, provider);
      const [name, symbol, baseId, decimals, version, currentSeriesId, currentPoolAddr, accountBalance] =
        await Promise.all([
          multicall.wrap(contract).name(),
          multicall.wrap(contract).symbol(),
          multicall.wrap(contract).baseId(),
          multicall.wrap(contract).decimals(),
          multicall.wrap(contract).version(),
          multicall.wrap(contract).seriesId(),
          multicall.wrap(contract).pool(),
          account ? multicall.wrap(contract).balanceOf(account) : ethers.constants.Zero,
        ]);

      const poolContract = Pool__factory.connect(currentPoolAddr, provider);
      const currentPoolMaturity = await multicall.wrap(poolContract).maturity();

      return (await acc).set(addr, {
        id: addr,
        address: addr,
        symbol,
        name,
        version,
        baseId,
        decimals,
        strategyContract: contract,
        currentSeriesId,
        currentPoolAddr,
        currentPoolMaturity,
        accountBalance: { value: accountBalance, formatted: formatUnits(accountBalance, decimals) },
      });
    }, Promise.resolve(new Map<string, IStrategy>()));
  };

  const key = useMemo(() => {
    return chainId ? ['strategies', chainId, account] : null;
  }, [account, chainId]);

  const { data, error } = useSWRImmutable(key, getStrategies);

  return {
    data,
    isLoading: !data && !error,
    key,
  };
};

export default useStrategies;

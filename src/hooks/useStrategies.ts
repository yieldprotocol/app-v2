import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useCallback, useContext, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount, useProvider } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import { Pool__factory, Strategy__factory } from '../contracts';
import { IStrategy, IStrategyRoot } from '../types';
import useChainId from './useChainId';
import yieldEnv from '../contexts/yieldEnv.json';

/**
 * Fetch all strategy data
 */
const useStrategies = () => {
  const {
    chainState: { strategyRootMap },
  } = useContext(ChainContext);

  const provider = useProvider();
  const chainId = useChainId();
  const { address: account } = useAccount();

  /* Iterate through the strategies list and update accordingly */
  const _getStrategies = useCallback(async () => {
    /**
     * IF: the CACHE is empty then, get fetch asset data for chainId and cache it:
     * */
    const cacheKey = `strategies_${chainId}`;
    const cachedValues = JSON.parse(localStorage.getItem(cacheKey)!);

    const newStrategyList: IStrategyRoot[] = [];
    const strategyList: string[] = (yieldEnv.strategies as any)[chainId];

    if (cachedValues !== null && cachedValues.length) {
      console.log('Yield Protocol STRATEGY data retrieved ::: CACHE :::');
      return cachedValues as IStrategyRoot[];
    }

    try {
      await Promise.all(
        strategyList.map(async (strategyAddr) => {
          /* if the strategy is NOT already in the cache : */
          const Strategy = Strategy__factory.connect(strategyAddr, provider);
          const [name, symbol, baseId, decimals, version] = await Promise.all([
            Strategy.name(),
            Strategy.symbol(),
            Strategy.baseId(),
            Strategy.decimals(),
            Strategy.version(),
          ]);

          const newStrategy: IStrategyRoot = {
            id: strategyAddr,
            address: strategyAddr,
            symbol,
            name,
            version,
            baseId,
            decimals,
            strategyContract: Strategy,
          };
          newStrategyList.push(newStrategy);
        })
      );
    } catch (e) {
      console.log('Error fetching strategies', e);
    }

    /* cache results */
    newStrategyList.length && localStorage.setItem(cacheKey, JSON.stringify(newStrategyList));
    newStrategyList.length && console.log('Yield Protocol Strategy data retrieved successfully.');
  }, [chainId, provider]);

  const getStrategies = async () => {
    const strategies = await _getStrategies();
    if (!strategies) return;

    return strategies.reduce(async (acc, s) => {
      const [currentSeriesId, currentPoolAddr, accountBalance] = await Promise.all([
        s.strategyContract.seriesId(),
        s.strategyContract.pool(),
        account ? s.strategyContract.balanceOf(account) : ethers.constants.Zero,
      ]);

      const poolContract = Pool__factory.connect(currentPoolAddr, provider);
      const currentPoolMaturity = await poolContract.maturity();

      return (await acc).set(s.address, {
        ...s,
        currentSeriesId,
        currentPoolAddr,
        currentPoolMaturity,
        accountBalance: { value: accountBalance, formatted: formatUnits(accountBalance, s.decimals) },
      });
    }, Promise.resolve(new Map<string, IStrategy>()));
  };

  const key = useMemo(() => {
    return strategyRootMap.size ? ['strategies', strategyRootMap, account] : null;
  }, [account, strategyRootMap]);

  const { data, error } = useSWRImmutable(key, getStrategies);

  return {
    data,
    isLoading: !data && !error,
    key,
  };
};

export default useStrategies;

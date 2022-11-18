import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useContext, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount, useProvider } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import { Pool__factory } from '../contracts';
import { IStrategy } from '../types';

/**
 * Fetch all strategy data
 */
const useStrategies = () => {
  const {
    chainState: { strategyRootMap },
  } = useContext(ChainContext);

  const provider = useProvider();
  const { address: account } = useAccount();

  const getStrategies = async () => {
    return [...strategyRootMap.values()].reduce(async (acc, s) => {
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

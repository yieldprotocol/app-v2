import { BigNumber, ethers } from 'ethers';
import { Strategy__factory } from '../../../contracts';
import yieldEnv from '../../../contexts/yieldEnv.json';
import { ISeries, IStrategy } from '../../../types';
import { ZERO_BN } from '../../../utils/constants';
import { divDecimal, mulDecimal } from '../../../utils/yieldMath';

export const getStrategies = async (provider: ethers.providers.JsonRpcProvider) => {
  const { chainId } = await provider.getNetwork();

  /* Get the hardcoded strategy addresses */
  const strategyAddresses = yieldEnv.strategies[chainId] as string[];

  return strategyAddresses.reduce(async (strategyMap, addr) => {
    const Strategy = Strategy__factory.connect(addr, provider);
    const [name, symbol, baseId, decimals, version] = await Promise.all([
      Strategy.name(),
      Strategy.symbol(),
      Strategy.baseId(),
      Strategy.decimals(),
      Strategy.version(),
    ]);

    const newStrategy = {
      id: addr,
      address: addr,
      symbol,
      name,
      version,
      baseId,
      decimals,
    };

    return { ...(await strategyMap), [addr]: newStrategy as IStrategy };
  }, {});
};

export const chargeStrategy = async (
  provider: ethers.providers.JsonRpcProvider,
  strategy: IStrategy,
  seriesMap: Map<string, ISeries>
) => {
  const strategyContract = Strategy__factory.connect(strategy.address, provider);
  const [strategyTotalSupply, currentSeriesId, currentPoolAddr, nextSeriesId] = await Promise.all([
    strategyContract.totalSupply(),
    strategyContract.seriesId(),
    strategyContract.pool(),
    strategyContract.nextSeriesId(),
  ]);
  const currentSeries = seriesMap.get(currentSeriesId);
  const nextSeries = seriesMap.get(nextSeriesId);

  if (currentSeries.poolContract) {
    const [poolTotalSupply, strategyPoolBalance] = await Promise.all([
      currentSeries.poolContract.totalSupply(),
      currentSeries.poolContract.balanceOf(strategy.address),
    ]);

    const [currentInvariant, initInvariant] = currentSeries.seriesIsMature ? [ZERO_BN, ZERO_BN] : [ZERO_BN, ZERO_BN];

    const strategyPoolPercent = mulDecimal(divDecimal(strategyPoolBalance, poolTotalSupply), '100');
    const returnRate = currentInvariant && currentInvariant.sub(initInvariant)!;

    return {
      ...strategy,
      strategyTotalSupply,
      strategyTotalSupply_: ethers.utils.formatUnits(strategyTotalSupply, strategy.decimals),
      poolTotalSupply,
      poolTotalSupply_: ethers.utils.formatUnits(poolTotalSupply, strategy.decimals),
      strategyPoolBalance,
      strategyPoolBalance_: ethers.utils.formatUnits(strategyPoolBalance, strategy.decimals),
      strategyPoolPercent,
      currentSeriesId,
      currentPoolAddr,
      nextSeriesId,
      currentSeries,
      nextSeries,
      initInvariant: initInvariant || BigNumber.from('0'),
      currentInvariant: currentInvariant || BigNumber.from('0'),
      returnRate,
      returnRate_: returnRate.toString(),
      active: true,
      strategyContract,
    };
  }

  /* else return an 'EMPTY' strategy */
  return {
    ...strategy,
    currentSeriesId,
    currentPoolAddr,
    nextSeriesId,
    currentSeries: undefined,
    nextSeries: undefined,
    active: false,
  };
};

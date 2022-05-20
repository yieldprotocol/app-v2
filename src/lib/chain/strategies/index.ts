import { ethers } from 'ethers';
import { Strategy__factory } from '../../../contracts';
import yieldEnv from '../../../contexts/yieldEnv.json';
import { IStrategyRoot } from '../../../types';

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

    return { ...(await strategyMap), [addr]: newStrategy as IStrategyRoot };
  }, {});
};

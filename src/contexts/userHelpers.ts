import { ethers } from 'ethers';
import { ISeries, IStrategyRoot } from '../types';
import { cleanValue } from '../utils/appUtils';
import { SECONDS_PER_YEAR } from '../utils/constants';
import { burnFromStrategy } from '../utils/yieldMath';

export const getStrategyBaseValuePerShare = async (
  strategy: IStrategyRoot,
  currStrategySeries: ISeries,
  blockNum: number
) => {
  try {
    const { poolContract } = currStrategySeries;
    const [[base, fyTokenVirtual], poolTotalSupply, strategyTotalSupply, fyTokenToBaseCostEstimate] = await Promise.all(
      [
        await poolContract.getCache({ blockTag: blockNum }),
        await poolContract.totalSupply({ blockTag: blockNum }),
        await strategy.strategyContract.totalSupply({ blockTag: blockNum }),
        await poolContract.sellFYTokenPreview(ethers.utils.parseUnits('1', currStrategySeries.decimals), {
          blockTag: blockNum,
        }), // estimate the base value of 1 fyToken unit
      ]
    );

    // the real balance of fyTokens in the pool
    const fyTokenReal = fyTokenVirtual.sub(poolTotalSupply);

    // the estimated base value of all fyToken in the pool
    const fyTokenToBaseValueEstimate = fyTokenReal
      .mul(fyTokenToBaseCostEstimate)
      .div(ethers.utils.parseUnits('1', currStrategySeries.decimals));

    // total estimated base value in pool
    const totalBaseValue = base.add(fyTokenToBaseValueEstimate);

    // total number of pool lp tokens associated with a strategy
    const poolLpReceived = burnFromStrategy(poolTotalSupply, strategyTotalSupply, strategyTotalSupply);

    // use Number instead of BigNumber because of precision issues
    // value per poolToken
    const valuePerPoolToken = Number(totalBaseValue) / Number(poolTotalSupply);
    // the amount of base per strategy LP token
    const baseValuePerStrategyLpToken = valuePerPoolToken * (Number(poolLpReceived) / Number(poolTotalSupply));
    return baseValuePerStrategyLpToken;
  } catch (e) {
    console.log('error getting strategy per share value', e);
    return undefined;
  }
};

export const getStrategyReturns = async (
  strategy: IStrategyRoot,
  currStrategySeries: ISeries,
  currBlock: number,
  preBlock: number,
  currBlockTimestamp: number,
  preBlockTimestamp: number
) => {
  try {
    const baseValuePerShareCurr = await getStrategyBaseValuePerShare(strategy, currStrategySeries, currBlock);
    const baseValuePerSharePre = await getStrategyBaseValuePerShare(strategy, currStrategySeries, preBlock);

    const returns = Number(baseValuePerShareCurr) / Number(baseValuePerSharePre) - 1;

    const secondsBetween = currBlockTimestamp - preBlockTimestamp;
    const periods = SECONDS_PER_YEAR / secondsBetween;

    const apy = (1 + returns / periods) ** periods - 1;
    const apy_ = cleanValue((apy * 100).toString(), 2);
    return apy_;
  } catch (e) {
    console.log(e);
  }
  return undefined;
};

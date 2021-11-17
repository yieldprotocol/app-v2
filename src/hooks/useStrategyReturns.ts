import { useContext, useEffect, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import { useBlockNum } from './useBlockNum';
import { burnFromStrategy, SECONDS_PER_YEAR } from '../utils/yieldMath';
import { ChainContext } from '../contexts/ChainContext';
import { ISeries, IStrategy } from '../types';

/**
 * returns the strategy's corresponding apy estimated based on the base value per share of the current block num and a previous block num (using last 7-8 days)
 * @param series
 * @param previousBlocks number of blocks to use for comparison (lookback window)
 */
export const useStrategyReturns = (strategy: IStrategy, previousBlocks: number) => {
  const {
    chainState: {
      connection: { fallbackProvider: provider },
    },
  } = useContext(ChainContext);

  const currentBlock = useBlockNum();
  const [previousBlock, setPreviousBlock] = useState<number>();

  const [strategyReturns, setStrategyReturns] = useState<string | null>(null);
  // number of seconds between comparison timeframe curr and pre
  const [secondsCompare, setSecondsCompare] = useState<number | null>(null);
  const [previousBlockTimestamp, setPreviousBlockTimestamp] = useState<any>();
  const [currBlockTimestamp, setCurrBlockTimestamp] = useState<any>();

  useEffect(() => {
    const _getStrategyBaseValuePerShare = async (blockNum: number) => {
      try {
        const { currentSeries } = strategy as IStrategy;
        const { poolContract } = currentSeries as ISeries;
        const [[base, fyTokenVirtual], poolTotalSupply, strategyTotalSupply, decimals, fyTokenToBaseCostEstimate] =
          await Promise.all([
            await poolContract.getCache({ blockTag: blockNum }),
            await poolContract.totalSupply({ blockTag: blockNum }),
            await strategy.strategyContract.totalSupply({ blockTag: blockNum }),
            await poolContract.decimals({ blockTag: blockNum }),
            await poolContract.sellFYTokenPreview(
              BigNumber.from(1).mul(BigNumber.from(10).pow(await poolContract.decimals())),
              {
                blockTag: blockNum,
              }
            ), // estimate the base value of 1 fyToken unit
          ]);

        // the real balance of fyTokens in the pool
        const fyTokenReal = (fyTokenVirtual as BigNumber).sub(poolTotalSupply as BigNumber);

        // the estimated base value of all fyToken in the pool
        const fyTokenToBaseValueEstimate = fyTokenReal
          .mul(fyTokenToBaseCostEstimate)
          .div(BigNumber.from(1).mul(BigNumber.from(10).pow(decimals)));

        // total estimated base value in pool
        const totalBaseValue = base.add(fyTokenToBaseValueEstimate);

        // number of pool lp tokens associated with a strategy
        const poolLpReceived = burnFromStrategy(poolTotalSupply, strategyTotalSupply, strategyTotalSupply);

        // the amount of base per strategy LP token
        const baseValuePerStrategyLpToken =
          (Number(totalBaseValue) / Number(poolTotalSupply)) * (Number(poolLpReceived) / Number(poolTotalSupply));

        return baseValuePerStrategyLpToken;
      } catch (e) {
        console.log('error getting strategy per share value', e);
        return 0;
      }
    };

    /* Compare base per share value for the current block versus the previous to compute apy */
    const _getStrategyReturns = async () => {
      if (strategy && currentBlock && previousBlock && currBlockTimestamp && previousBlockTimestamp) {
        try {
          const baseValuePerShareCurr = await _getStrategyBaseValuePerShare(Number(currentBlock));
          const baseValuePerSharePre = await _getStrategyBaseValuePerShare(Number(previousBlock));

          const returns = Number(baseValuePerShareCurr) / Number(baseValuePerSharePre) - 1;

          const secondsBetween = currBlockTimestamp - previousBlockTimestamp;
          setSecondsCompare(secondsBetween);
          const periods = SECONDS_PER_YEAR / secondsBetween;

          const apy = (1 + returns / periods) ** periods - 1;
          const apy_ = (apy * 100).toString();
          setStrategyReturns(apy_);
          return apy_;
        } catch (e) {
          console.log(e);
        }
      }
      return 0;
    };
    _getStrategyReturns();
  }, [strategy, currentBlock, previousBlock, currBlockTimestamp, previousBlockTimestamp]);

  /* Get blocks to use for comparison, and corresponding timestamps */
  useEffect(() => {
    (async () => {
      if (currentBlock && provider) {
        try {
          const _preBlock = Number(currentBlock) - previousBlocks; // use around 7 days ago timeframe in blocktime
          setPreviousBlock(_preBlock);
          setPreviousBlockTimestamp((await provider.getBlock(Number(_preBlock))).timestamp);
          setCurrBlockTimestamp((await provider.getBlock(Number(currentBlock))).timestamp);
        } catch (e) {
          console.log('could not get timestamps', e);
        }
      }
    })();
  }, [currentBlock, provider, previousBlocks]);

  return { strategyReturns, secondsCompare };
};

import { useContext, useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import { useBlockNum } from './useBlockNum';
import { SECONDS_PER_YEAR } from '../utils/yieldMath';
import { ChainContext } from '../contexts/ChainContext';
import { ISeries } from '../types';

/**
 * returns the series' corresponding pool's apy estimated based on the current block num and a previous block num (using last 7-8 days)
 * @param series
 * @param previousBlocks number of blocks to use for comparison (lookback window)
 */
export const usePoolReturns = (series: ISeries, previousBlocks: number) => {
  const {
    chainState: {
      connection: { fallbackProvider: provider },
    },
  } = useContext(ChainContext);

  const currentBlock = useBlockNum();
  const [previousBlock, setPreviousBlock] = useState<number>();

  const [poolReturns, setPoolReturns] = useState<string | null>(null);
  // number of seconds between comparison timeframe curr and pre
  const [secondsCompare, setSecondsCompare] = useState<number | null>(null);
  const [previousBlockTimestamp, setPreviousBlockTimestamp] = useState<any>();
  const [currBlockTimestamp, setCurrBlockTimestamp] = useState<any>();

  useEffect(() => {
    const _getPoolBaseValuePerShare = async (blockNum: number) => {
      try {
        const { poolContract } = series;
        const [[base, fyTokenVirtual], totalSupply, decimals, fyTokenToBaseCostEstimate] = await Promise.all([
          await poolContract.getCache({ blockTag: blockNum }),
          await poolContract.totalSupply({ blockTag: blockNum }),
          await poolContract.decimals({ blockTag: blockNum }),
          await poolContract.sellFYTokenPreview(
            BigNumber.from(1).mul(BigNumber.from(10).pow(await series.poolContract.decimals())),
            {
              blockTag: blockNum,
            }
          ), // estimate the base value of 1 fyToken unit
        ]);

        // the real balance of fyTokens in the pool
        const fyTokenReal = (fyTokenVirtual as BigNumber).sub(totalSupply as BigNumber);

        // the estimated base value of all fyToken in the pool
        const fyTokenToBaseValueEstimate = fyTokenReal
          .mul(fyTokenToBaseCostEstimate)
          .div(BigNumber.from(1).mul(BigNumber.from(10).pow(decimals)));

        // total estimated base value in pool
        const totalValue = base.add(fyTokenToBaseValueEstimate);

        // the amount of base per LP token
        const valuePerShare = Number(totalValue.toString()) / Number(totalSupply.toString());
        return valuePerShare;
      } catch (e) {
        console.log('error getting pool per share value', e);
        return 0;
      }
    };

    /* Compare base per share value for the current block versus the previous to compute apy */
    const _getPoolReturns = async () => {
      if (series && currentBlock && previousBlock && currBlockTimestamp && previousBlockTimestamp) {
        try {
          const baseValuePerShareCurr = await _getPoolBaseValuePerShare(Number(currentBlock));
          const baseValuePerSharePre = await _getPoolBaseValuePerShare(Number(previousBlock));
          const returns = Number(baseValuePerShareCurr) / Number(baseValuePerSharePre) - 1;

          const secondsBetween = currBlockTimestamp - previousBlockTimestamp;
          setSecondsCompare(secondsBetween);
          const periods = SECONDS_PER_YEAR / secondsBetween;

          const apy = (1 + returns / periods) ** periods - 1;
          const apy_ = (apy * 100).toString();
          setPoolReturns(apy_);
          return apy_;
        } catch (e) {
          console.log(e);
        }
      }
      return 0;
    };
    _getPoolReturns();
  }, [series, currentBlock, previousBlock, currBlockTimestamp, previousBlockTimestamp]);

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

  return { poolReturns, secondsCompare };
};

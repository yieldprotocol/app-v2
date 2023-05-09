import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr';
import { USDC, USDT, WETH } from '../config/assets';
import { cleanValue } from '../utils/appUtils';
import { ZERO_BN } from '../utils/constants';
import useAssetPairVR from './viewHelperHooks/useAssetPair/useAssetPairVR';

export const useConvertValue = () => {
  const { cache, mutate } = useSWRConfig();
  const { genKey: genAssetPairKey, getAssetPair } = useAssetPairVR();

  const convertValue = useCallback(
    async (toAssetId = USDC, fromAssetId, value = '1') => {
      if (+value === 0) return 0;
      if (toAssetId === fromAssetId) return Number(value);

      const pairKey = unstable_serialize(genAssetPairKey(toAssetId, fromAssetId));
      let pair = cache.get(pairKey)?.data;
      if (!pair) {
        try {
          pair = await getAssetPair(toAssetId, fromAssetId);
        } catch (e) {
          console.log('trying to get USDT pair instead of USDC if toAssetId is USDC');
          if (toAssetId === USDC) {
            if (fromAssetId === USDT) return Number(value);
            pair = await getAssetPair(USDT, fromAssetId);
          }
        }
        // this is from the original function, but why would we always set pair to undefined?
        // we will always end up returning 0 this way
        // finally {
        //   pair = undefined;
        // }
        mutate(pairKey, pair);
      }

      if (!pair) return 0;
      return Number(ethers.utils.formatUnits(pair.pairPrice, pair.baseDecimals)) * Number(value);
    },
    [cache, genAssetPairKey, getAssetPair, mutate]
  );

  return { convertValue };
};

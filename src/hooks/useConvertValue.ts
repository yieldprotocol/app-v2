import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr';
import { USDC, USDT } from '../config/assets';
import useAssetPair from './viewHelperHooks/useAssetPair/useAssetPair';

export const useConvertValue = () => {
  const { cache, mutate } = useSWRConfig();
  const { genKey: genAssetPairKey, getAssetPair } = useAssetPair();

  const convertValue = useCallback(
    async (toAssetId = USDC, fromAssetId: string, value = '1') => {
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

        mutate(pairKey, pair);
      }

      if (!pair) return 0;
      return Number(ethers.utils.formatUnits(pair.pairPrice, pair.baseDecimals)) * Number(value);
    },
    [cache, genAssetPairKey, getAssetPair, mutate]
  );

  return { convertValue };
};

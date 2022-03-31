import { useContext, useState, useEffect } from 'react';

import { IAsset, IAssetPair, IPriceContext } from '../types';
import { PriceContext } from '../contexts/PriceContext';

/* Generic hook for chain transactions */
export const useAssetPair = (base?: IAsset, collateral?: IAsset): IAssetPair | undefined => {
  const {
    priceState: { pairMap, pairLoading },
    priceActions: { updateAssetPair },
  } = useContext(PriceContext) as IPriceContext;

  /* LOCAL STATE */
  const [assetPair, setAssetPair] = useState<IAssetPair>();

  useEffect(() => {
    if (base && collateral) {
      pairMap.has(base.id + collateral.id) && setAssetPair(pairMap.get(base.id + collateral.id));
      !pairMap.has(base.id + collateral.id) &&
        !pairLoading.includes(base.id + collateral.id) &&
        updateAssetPair(base.id, collateral.id);
    }
  }, [base, collateral, pairMap, pairLoading]);

  return assetPair;
};

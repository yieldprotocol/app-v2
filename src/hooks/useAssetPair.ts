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
      pairMap.has(base.proxyId + collateral.proxyId) && setAssetPair(pairMap.get(base.proxyId + collateral.proxyId));
      !pairMap.has(base.proxyId + collateral.proxyId) &&
        !pairLoading.includes(base.proxyId + collateral.proxyId) &&
        updateAssetPair(base.proxyId, collateral.proxyId);
    }
  }, [base, collateral, pairMap, pairLoading]);

  return assetPair;
};

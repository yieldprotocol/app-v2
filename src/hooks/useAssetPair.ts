import { useContext, useState, useEffect } from 'react';

import { IAsset, IAssetPair } from '../types';
import { PriceContext } from '../contexts/PriceContext';
import { UserContext } from '../contexts/UserContext';

/* Generic hook for chain transactions */
export const useAssetPair = (base?: IAsset, collateral?: IAsset): IAssetPair | undefined => {
  
  const { pairMap, updateAssetPair, pairLoading } = useContext(PriceContext);
  const { selectedBase, selectedIlk } = useContext(UserContext);

  /* LOCAL STATE */
  const [assetPair, setAssetPair] = useState<IAssetPair>();
  const [pairId, setPairId] = useState<string>();

  useEffect(() => {
    !!base && !!collateral && setPairId(`${base.id}${base.id}`);
  }, [base, collateral]);

  useEffect(() => {

 
    if (base && collateral) {
        pairMap.has(base.id + collateral.id) &&
          setAssetPair(pairMap.get(base.id + collateral.id));

        !pairMap.has(base.id + collateral.id) &&
          !pairLoading.includes(base.id + collateral.id) &&
          updateAssetPair(base.id, collateral.id);
      }

    // if (!pairLoading.includes(pairId)) {
    //   pairMap.has(pairId) && setAssetPair(pairMap.get(pairId));
    //   !pairMap.has(pairId) &&
    //     !pairLoading.includes(pairId) &&
    //     updateAssetPair(base?.id || selectedBase, collateral?.id || selectedIlk);
    // }
  }, [base, collateral, pairMap, pairLoading]);

  return assetPair;
};

// const { pairMap, updateAssetPair, pairLoading } = useContext(PriceContext);
// const [assetPairInfo, setAssetPairInfo] = useState<IAssetPair>();
// useEffect(() => {
//   if (vaultBase && vaultIlk) {
//     pairMap.has(vaultBase.id + vaultIlk.id) &&
//       setAssetPairInfo(pairMap.get(vaultBase.id + vaultIlk.id));
//     !pairMap.has(vaultBase.id + vaultIlk.id) &&
//       !pairLoading.includes(vaultBase.id + vaultIlk.id) &&
//       updateAssetPair(vaultBase.id, vaultIlk.id);
//   }
// }, [ vaultBase, vaultIlk, pairMap, pairLoading]);

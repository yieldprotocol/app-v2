import { useContext, useState, useEffect, useCallback } from 'react';

import { IAsset, IAssetPair, ISettingsContext, IUserContext } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import { UserContext } from '../contexts/UserContext';

/* Generic hook for chain transactions */
export const useAssetPair = (base: IAsset, collateral: IAsset): IAssetPair | undefined => {
  /* CONTEXT STATE */
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext) as ISettingsContext;

  const {
    userState: { assetPairMap, assetPairLoading },
    userActions: { updateAssetPair },
  } = useContext(UserContext) as IUserContext;

  /* LOCAL STATE */
  const [assetPair, setAssetPair] = useState<IAssetPair | undefined>();

  /* update pair if required */
  const updatePair = useCallback(
    async (_b: IAsset, _c: IAsset) => {
      diagnostics && console.log('Updating assetPAir.... from hook '); 
      const pair_: IAssetPair = await updateAssetPair(_b.unwrappedTokenId || _b.id,  _c.unwrappedTokenId || _c.id); // note: uses unwarppedTokenId for price if available
      setAssetPair(pair_);
    },
    [updateAssetPair]
  );

  useEffect(() => {
    if (base?.id && collateral?.id && !assetPairLoading) {
      /* try get from state first */
      const pair_ = assetPairMap.get(`${base.unwrappedTokenId || base.id}${ collateral.unwrappedTokenId || collateral.id}`); // note: uses unwarppedTokenId for price if availabel
      pair_ && setAssetPair(pair_);
      /* else update the pair data */
      !pair_ && (async () => updatePair(base, collateral))();
    }
  }, [assetPairLoading, assetPairMap, base, collateral, updatePair]);

  return assetPair;
};

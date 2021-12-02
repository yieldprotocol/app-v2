import { useContext, useState, useEffect, useCallback } from 'react';

import { IAsset, IAssetPair, ISettingsContext } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import { UserContext } from '../contexts/UserContext';

/* Generic hook for chain transactions */
export const useAssetPair = (collateral: IAsset, base: IAsset) => {
  /* CONTEXT STATE */
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext) as ISettingsContext;

  const {
    userState: { assetPairMap },
    userActions: { updateAssetPair },
  } = useContext(UserContext);

  /* LOCAL STATE */
  const [assetPair, setAssetPair] = useState<IAssetPair>();

  /* update pair if required */
  const updatePair = useCallback( async (_bas: IAsset, _coll: IAsset) => {
    const pair_ = await updateAssetPair(_bas.id,_coll.id );
    setAssetPair(pair_);
  }, [updateAssetPair]);

  useEffect(() => {
    if (base && collateral) {
    /* try get from state first */
    const pair_ = assetPairMap.get(base.id + collateral.id);
    pair_ && setAssetPair(pair_);
    /* else update the pair data */
    !pair_ && updatePair(base, collateral)
    }
  }, [assetPairMap, base, collateral, updatePair]);

  return assetPair;
};

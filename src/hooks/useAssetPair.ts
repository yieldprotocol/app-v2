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
      diagnostics && console.log('Updating assetPair.... from hook');
      const pair_: IAssetPair = await updateAssetPair(_b.id, _c.id);
      setAssetPair(pair_);
    },
    [updateAssetPair]
  );

  useEffect(() => {
    if (base?.id && collateral?.id && !assetPairLoading) {
      /* try get from state first */
      const pair_ = assetPairMap.get(`${base.id}${collateral.id}`);
      pair_ && setAssetPair(pair_);
      /* else update the pair data */
      !pair_ && (async () => updatePair(base, collateral))();
    }
  }, [assetPairLoading, assetPairMap, base, collateral, updatePair]);

  return assetPair;
};

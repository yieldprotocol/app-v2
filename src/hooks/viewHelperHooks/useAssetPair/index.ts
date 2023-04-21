/* HOOKS */
import useAssetPairFixedRate from './useAssetPairFR';
import useAssetPairVariableRate from './useAssetPairVR';
import { useContext } from 'react';

/* CONTEXTS */
import { UserContext } from '../../../contexts/UserContext';

const useAssetPair = (baseId?: string, ilkId?: string, seriesId?: string) => {
  const { userState } = useContext(UserContext);
  const { selectedVR } = userState;

  const assetPairVR = useAssetPairVariableRate(baseId, ilkId);
  const assetPairFR = useAssetPairFixedRate(baseId, ilkId, seriesId);

  return selectedVR ? assetPairVR : assetPairFR;
};

export default useAssetPair;

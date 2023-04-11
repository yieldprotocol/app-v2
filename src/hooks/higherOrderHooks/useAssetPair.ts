/* HOOKS */
import useAssetPairFixedRate from '../useAssetPairFixedRate';
import useAssetPairVariableRate from '../useAssetPairVariableRate';
import { useContext } from 'react';

/* CONTEXTS */
import { UserContext } from '../../contexts/UserContext';

const useAssetPair = (baseId?: string, ilkId?: string, seriesId?: string) => {
  const { userState } = useContext(UserContext);
  const { selectedVR } = userState;

  if (selectedVR) {
    return useAssetPairVariableRate(baseId, ilkId);
  } else {
    return useAssetPairFixedRate(baseId, ilkId, seriesId);
  }
};

export default useAssetPair;

import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, IVault, SignType, ISeries, ActionCodes, IUserContext, LadleActions } from '../../types';
import { getTxCode, cleanValue } from '../../utils/appUtils';
import { DAI_BASED_ASSETS, ETH_BASED_ASSETS } from '../../utils/constants';
import { useChain } from '../useChain';

import { calculateCollateralizationRatio, calculateMinCollateral } from '../../utils/yieldMath';

/* Collateralisation hook calculates collateralisation metrics */
export const useBorrowHelpers = (
  debtInput: string | undefined,
  collInput: string | undefined,
  vault: IVault | undefined
) => {

  /* STATE FROM CONTEXT */
  const {
    userState: { selectedBaseId, selectedIlkId, priceMap },
    userActions: { updatePrice },
  } = useContext(UserContext);

  /* LOCAL STATE */
  const [minAllowedBorrow, setMinAllowedBorrow] = useState<string | undefined>();
  const [maxAllowedBorrow, setMaxAllowedBorrow] = useState<string | undefined>();


  /* update the prices if anything changes */
  useEffect(() => {

  }, [priceMap, selectedBaseId, selectedIlkId, updatePrice]);


  return {
    minAllowedBorrow,
    maxAllowedBorrow,
  };
};

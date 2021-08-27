import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, IVault, SignType, ISeries, ActionCodes, IUserContext, LadleActions, IAsset } from '../../types';
import { getTxCode, cleanValue } from '../../utils/appUtils';
import { DAI_BASED_ASSETS, ETH_BASED_ASSETS } from '../../utils/constants';
import { useChain } from '../useChain';

import { calculateCollateralizationRatio, calculateMinCollateral } from '../../utils/yieldMath';

/* Collateralisation hook calculates collateralisation metrics */
export const useBorrowHelpers = (
  input: string | undefined,
  collateralInput: string | undefined,
  vault: IVault | undefined
) => {

  /* STATE FROM CONTEXT */
  const {
    userState: { activeAccount, selectedBaseId, selectedIlkId, assetMap, seriesMap },
  } = useContext(UserContext);

  const vaultBase: IAsset | undefined = assetMap.get(vault?.baseId!);
  const vaultIlk: IAsset | undefined = assetMap.get(vault?.ilkId!);
  const vaultSeries: ISeries | undefined = seriesMap.get(vault?.seriesId!);

  /* LOCAL STATE */
  const [minAllowedBorrow, setMinAllowedBorrow] = useState<string | undefined>();
  const [maxAllowedBorrow, setMaxAllowedBorrow] = useState<string | undefined>();

  const [maxRepayOrRoll, setMaxRepayOrRoll] = useState<string | undefined>();
  const [minRepayOrRoll, setMinRepayOrRoll] = useState<string | undefined>();

  /* update the minimum maxmimum allowable debt */
  useEffect(() => {
    setMinAllowedBorrow('0.5');
    setMaxAllowedBorrow('1000000');
  }, [selectedBaseId, selectedIlkId]);

  /* update the min max repayable or rollable */
  useEffect(() => {

    const inputBn = input ? ethers.utils.parseUnits(input, vaultBase?.decimals ): ethers.constants.Zero;
    const minDebt = ethers.utils.parseUnits('0.5', vaultBase?.decimals );
 
    /* CHECK the max available repay */
    if (activeAccount) {
      (async () => {
        const _maxToken = await vaultBase?.getBalance(activeAccount);
        const _max = _maxToken && vault?.art.gt(_maxToken) ? _maxToken : vault?.art;
        _max && setMaxRepayOrRoll(ethers.utils.formatEther(_max)?.toString());
      })();

      /* if the input if less than the debt, make sure the minRepay is set to the debt less 0.5  - to leave 0.5 in the vault - above dust level */
      if ( inputBn.lt(vault?.art!) ) {
        setMinRepayOrRoll(vault?.art.sub(minDebt).toString());
      } else {
        setMinRepayOrRoll(undefined);
      }     
    }

  }, [activeAccount, vault, vaultBase, input]);

  return {
    minAllowedBorrow,
    maxAllowedBorrow,
    maxRepayOrRoll,
    minRepayOrRoll
  };
};

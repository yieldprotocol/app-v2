import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import { IVault, ISeries, IAsset } from '../../types';

/* Collateralisation hook calculates collateralisation metrics */
export const useBorrowHelpers = (
  input: string | undefined,
  collateralInput: string | undefined,
  vault: IVault | undefined
) => {
  /* STATE FROM CONTEXT */
  const {
    userState: { activeAccount, selectedBaseId, selectedIlkId, assetMap },
  } = useContext(UserContext);

  const vaultBase: IAsset | undefined = assetMap.get(vault?.baseId!);

  /* LOCAL STATE */
  const [minAllowedBorrow, setMinAllowedBorrow] = useState<string | undefined>();
  const [maxAllowedBorrow, setMaxAllowedBorrow] = useState<string | undefined>();

  const [maxRepayOrRoll, setMaxRepayOrRoll] = useState<string | undefined>();
  const [maxRepayDustLimit, setMaxRepayDustLimit] = useState<string | undefined>();

  /* update the minimum maxmimum allowable debt */
  useEffect(() => {
    setMinAllowedBorrow('0.5');
    setMaxAllowedBorrow('1000000');
  }, [selectedBaseId, selectedIlkId]);

  /* update the min max repayable or rollable */
  useEffect(() => {
    
    /* CHECK the max available repay */
    if (activeAccount && vault) {

      const minDebt = ethers.utils.parseUnits('0.5', vaultBase?.decimals);
      (async () => {
        const _maxToken = await vaultBase?.getBalance(activeAccount);

        const _max = _maxToken && vault.art.gt(_maxToken) ? _maxToken : vault.art;
        const _maxDust = _max.sub(minDebt);

        _max && setMaxRepayOrRoll(ethers.utils.formatUnits(_max, vaultBase?.decimals)?.toString());
        _maxDust && setMaxRepayDustLimit(ethers.utils.formatUnits(_maxDust, vaultBase?.decimals)?.toString());

      })();
    }

  }, [activeAccount, vault, vaultBase ]);


  return {
    minAllowedBorrow,
    maxAllowedBorrow,
    maxRepayOrRoll,
    maxRepayDustLimit,
  };
};

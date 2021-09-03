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
  const [minRepayOrRoll, setMinRepayOrRoll] = useState<string | undefined>();

  /* update the minimum maxmimum allowable debt */
  useEffect(() => {
    setMinAllowedBorrow('0.5');
    setMaxAllowedBorrow('1000000');
  }, [selectedBaseId, selectedIlkId]);

  /* update the min max repayable or rollable */
  useEffect(() => {
    /* CHECK the max available repay */
    if (activeAccount && vault) {
      (async () => {
        const _maxToken = await vaultBase?.getBalance(activeAccount);
        const _max = _maxToken && vault.art.gt(_maxToken) ? _maxToken : vault.art;
        _max && setMaxRepayOrRoll(ethers.utils.formatUnits(_max, vaultBase?.decimals)?.toString());
      })();
    }
  }, [activeAccount, vault, vaultBase, input]);

    /* update the min repayable or rollable */
    useEffect(() => {
      const inputBn = input ? ethers.utils.parseUnits(input, vaultBase?.decimals) : ethers.constants.Zero;
      const minDebt = ethers.utils.parseUnits('0.5', vaultBase?.decimals);

      /* CHECK the max available repay */
      if (activeAccount && vault) {
        /* if the input if less than the debt, make sure the minRepay is set to the debt less 0.5  - to leave 0.5 in the vault - above dust level */
        if (inputBn.lt(vault.art!)) {
          const _min = vault.art.sub(minDebt);
          setMinRepayOrRoll(ethers.utils.formatUnits(_min, vaultBase?.decimals)?.toString());
        } else {
          setMinRepayOrRoll(ethers.constants.Zero.toString());
        }
      }
  
    }, [activeAccount, input, vault, vaultBase?.decimals]);


  return {
    minAllowedBorrow,
    maxAllowedBorrow,
    maxRepayOrRoll,
    minRepayOrRoll,
  };
};

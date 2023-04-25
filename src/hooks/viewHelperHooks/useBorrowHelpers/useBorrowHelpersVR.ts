// TODO - havent modified this to VR yet - jacob b
import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';

import { SettingsContext } from '../../../contexts/SettingsContext';
import { UserContext } from '../../../contexts/UserContext';
import { IVault, IAssetPair } from '../../../types';
import { cleanValue } from '../../../utils/appUtils';
import { ZERO_BN } from '../../../utils/constants';
import { Address, useAccount, useBalance, useProvider } from 'wagmi';
import { WETH } from '../../../config/assets';
import useAccountPlus from '../../useAccountPlus';
import { VYJoin__factory } from '../../../contracts';
import useSWR from 'swr';

/* Collateralization hook calculates collateralization metrics */
export const useBorrowHelpersVR = (
  input: string | undefined,
  collateralInput: string | undefined,
  vault: IVault | undefined,
  assetPairInfo: IAssetPair | null | undefined
) => {
  /* STATE FROM CONTEXT */
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const {
    userState: { assetMap, selectedBase },
  } = useContext(UserContext);

  const provider = useProvider();

  const vaultBase = assetMap.get(vault?.baseId!);

  const { address: account } = useAccountPlus();
  const { data: baseBalance } = useBalance({
    address: account,
    token: vaultBase?.proxyId === WETH ? undefined : (vaultBase?.address as Address),
  });

  const fetchJoinBalance = async (joinAddr: string, provider: any) => {
    const join = VYJoin__factory.connect(joinAddr, provider);
    const joinBalance = await join.storedBalance();
    return joinBalance;
  };

  /* LOCAL STATE */

  const [debtAfterRepay, setDebtAfterRepay] = useState<BigNumber>();

  /* the accrued art in base terms at this moment */
  /* before maturity, this is the estimated amount of fyToken (using art) that can be bought using base */
  /* after maturity, this is the vault's art plus any variable rate accrued art */

  const [debtInBase, setDebtInBase] = useState<BigNumber>(ethers.constants.Zero);
  const [debtInBase_, setDebtInBase_] = useState<string | undefined>();

  const [minDebt, setMinDebt] = useState<BigNumber>();
  const [minDebt_, setMinDebt_] = useState<string | undefined>();

  const [maxDebt, setMaxDebt] = useState<BigNumber>();
  const [maxDebt_, setMaxDebt_] = useState<string | undefined>();

  const [maxRepay, setMaxRepay] = useState<BigNumber>(ethers.constants.Zero);
  const [maxRepay_, setMaxRepay_] = useState<string | undefined>();

  const [minRepayable, setMinRepayable] = useState<BigNumber>(ethers.constants.Zero);
  const [minRepayable_, setMinRepayable_] = useState<string | undefined>();

  const [borrowPossible, setBorrowPossible] = useState<boolean>(false);

  /* get join balance when selectedBase changes */
  const { data: joinBalance, error: joinBalanceError } = useSWR(selectedBase?.joinAddressVR, async (joinAddress) => {
    const join = VYJoin__factory.connect(joinAddress, provider);
    return await join.storedBalance();
  });

  console.log('assetPairInfo: ', assetPairInfo);

  /* Update the borrow limits if asset pair changes */
  useEffect(() => {
    if (assetPairInfo) {
      const _decimals = assetPairInfo.limitDecimals;
      const _maxLessTotal = assetPairInfo.maxDebtLimit.sub(assetPairInfo.pairTotalDebt);
      const _min = assetPairInfo.minDebtLimit;

      setMaxDebt(_maxLessTotal);
      setMaxDebt_(ethers.utils.formatUnits(_maxLessTotal, _decimals)?.toString());
      setMinDebt(_min);
      setMinDebt_(ethers.utils.formatUnits(_min, assetPairInfo.baseDecimals)?.toString());
    }
  }, [assetPairInfo]);

  /* check if a user can borrow based on join balance */
  useEffect(() => {
    if (selectedBase && joinBalance && input && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, selectedBase.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, selectedBase.decimals);
      input_.lte(joinBalance) ? setBorrowPossible(true) : setBorrowPossible(false);
    }
  }, [selectedBase, input, joinBalance]);

  /* check the new debt level after potential repaying */
  useEffect(() => {
    if (input && vault && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, vault.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, vault.decimals);
      /* remaining debt is debt in base less input (with a minimum of zero) */
      const remainingDebt = debtInBase.sub(input_).gte(ZERO_BN) ? debtInBase.sub(input_) : ZERO_BN;

      setDebtAfterRepay(remainingDebt);
    }
  }, [input, vault, debtInBase]);

  /* Update the Min Max repayable amounts */
  useEffect(() => {
    if (account && vault && vaultBase && minDebt) {
      setDebtInBase(vault.accruedArt);
      setDebtInBase_(vault.accruedArt_);

      const _baseRequired = vault.accruedArt.eq(ethers.constants.Zero) ? ethers.constants.Zero : vault.accruedArt; // modified this logic from original, TODO verify this logic - jacob b
      const _debtInBase = _baseRequired;

      // add buffer to handle moving interest accumulation
      const _debtInBaseWithBuffer = _debtInBase.mul(1000).div(999);

      setDebtInBase(_debtInBaseWithBuffer);
      setDebtInBase_(ethers.utils.formatUnits(_debtInBaseWithBuffer, vaultBase.decimals));

      /* maxRepayable is either the max tokens they have or max debt */
      const _maxRepayable =
        baseBalance?.value && _debtInBaseWithBuffer.gt(baseBalance.value) ? baseBalance.value : _debtInBaseWithBuffer;

      /* set the min repayable up to the dust limit */
      const _maxToDust = vault.accruedArt.gt(minDebt) ? _maxRepayable.sub(minDebt) : vault.accruedArt;
      _maxToDust && setMinRepayable(_maxToDust);
      _maxToDust && setMinRepayable_(ethers.utils.formatUnits(_maxToDust, vaultBase?.decimals)?.toString());

      const _accruedArt = vault.accruedArt.gt(baseBalance?.value || ethers.constants.Zero)
        ? baseBalance?.value!
        : vault.accruedArt;
      setMaxRepay(_accruedArt);
      setMaxRepay_(debtInBase_);
    }
  }, [account, baseBalance?.formatted, baseBalance?.value, minDebt, vault, vaultBase]);

  console.log('useBorrowHelpersVR returns', {
    borrowPossible,

    maxRepay_,
    maxRepay,

    debtInBase,
    debtInBase_,

    debtAfterRepay,

    minRepayable,
    minRepayable_,

    userBaseBalance: baseBalance?.value,
    userBaseBalance_: baseBalance?.formatted,
    maxDebt,
    minDebt,
    maxDebt_,
    minDebt_,
  });

  return {
    borrowPossible,

    maxRepay_,
    maxRepay,

    debtInBase,
    debtInBase_,

    debtAfterRepay,

    minRepayable,
    minRepayable_,

    userBaseBalance: baseBalance?.value,
    userBaseBalance_: baseBalance?.formatted,
    maxDebt,
    minDebt,
    maxDebt_,
    minDebt_,
  };
};

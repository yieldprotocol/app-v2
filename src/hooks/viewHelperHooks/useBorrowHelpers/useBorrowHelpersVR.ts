// TODO - havent modified this to VR yet - jacob b
import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { SettingsContext } from '../../../contexts/SettingsContext';
import { UserContext } from '../../../contexts/UserContext';
import { IVault, IAssetPair } from '../../../types';
import { cleanValue } from '../../../utils/appUtils';
import { ZERO_BN } from '../../../utils/constants';
import { Address, useBalance, useProvider } from 'wagmi';
import { WETH } from '../../../config/assets';
import useAccountPlus from '../../useAccountPlus';
import { VYJoin__factory } from '../../../contracts';
import useSWR from 'swr';
import { formatUnits } from 'ethers/lib/utils.js';

/* Collateralization hook calculates collateralization metrics */
export const useBorrowHelpersVR = (
  input: string | undefined,
  vault: IVault | undefined,
  assetPairInfo: IAssetPair | null | undefined
) => {
  /* STATE FROM CONTEXT */
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

  /* LOCAL STATE */
  const [debtAfterRepay, setDebtAfterRepay] = useState<BigNumber>();

  const [debtInBase, setDebtInBase] = useState<BigNumber>();
  const [debtInBase_, setDebtInBase_] = useState<string>();

  const [minDebt, setMinDebt] = useState<BigNumber>();
  const [minDebt_, setMinDebt_] = useState<string>();

  const [maxDebt, setMaxDebt] = useState<BigNumber>();
  const [maxDebt_, setMaxDebt_] = useState<string>();

  const [maxRepay, setMaxRepay] = useState<BigNumber>();
  const [maxRepay_, setMaxRepay_] = useState<string>();

  const [minRepayable, setMinRepayable] = useState<BigNumber>();
  const [minRepayable_, setMinRepayable_] = useState<string>();

  const [borrowPossible, setBorrowPossible] = useState<boolean>(false);

  /* get join balance when selectedBase changes */
  const { data: joinBalance } = useSWR(
    selectedBase?.joinAddressVR,
    async (joinAddress) => {
      const join = VYJoin__factory.connect(joinAddress, provider);
      return await join.storedBalance();
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

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
      setBorrowPossible(input_.lt(joinBalance));
    }
  }, [selectedBase, input, joinBalance]);

  /* check the new debt level after potential repaying */
  useEffect(() => {
    if (input && vault && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, vault.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, vault.decimals);
      /* remaining debt is debt in base less input (with a minimum of zero) */
      const remainingDebt = debtInBase?.sub(input_).gte(ZERO_BN) ? debtInBase.sub(input_) : ZERO_BN;

      setDebtAfterRepay(remainingDebt);
    }
  }, [input, vault, debtInBase]);

  /* Update the Min Max repayable amounts */
  useEffect(() => {
    if (account && vault && vaultBase && minDebt) {
      setDebtInBase(vault.accruedArt);
      setDebtInBase_(vault.accruedArt_);

      // add buffer to handle moving interest accumulation
      const _debtInBaseWithBuffer = vault.accruedArt.mul(1000).div(999);

      setDebtInBase(_debtInBaseWithBuffer);
      setDebtInBase_(ethers.utils.formatUnits(_debtInBaseWithBuffer, vaultBase.decimals));

      /* maxRepayable is either the max tokens they have or max debt */
      const _maxRepayable =
        baseBalance?.value && _debtInBaseWithBuffer.gt(baseBalance.value) ? baseBalance.value : _debtInBaseWithBuffer;

      /* set the min repayable up to the dust limit */
      const _maxToDust = vault.accruedArt.gt(minDebt) ? _maxRepayable.sub(minDebt) : vault.accruedArt;
      _maxToDust && setMinRepayable(_maxToDust);
      _maxToDust && setMinRepayable_(formatUnits(_maxToDust, vaultBase?.decimals));

      setMaxRepay(_maxRepayable);
      setMaxRepay_(formatUnits(_maxRepayable, vaultBase?.decimals));
    }
  }, [account, baseBalance?.value, minDebt, vault, vaultBase]);

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

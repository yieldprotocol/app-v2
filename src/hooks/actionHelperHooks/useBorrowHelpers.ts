import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { IVault, ISeries, IAsset } from '../../types';
import { cleanValue } from '../../utils/appUtils';

import { maxBaseIn, sellBase } from '../../utils/yieldMath';

/* Collateralization hook calculates collateralization metrics */
export const useBorrowHelpers = (
  input: string | undefined,
  collateralInput: string | undefined,
  vault: IVault | undefined,
  futureSeries: ISeries | undefined = undefined // Future or rollToSeries
) => {
  /* STATE FROM CONTEXT */
  const {
    userState: { activeAccount, selectedBaseId, selectedIlkId, assetMap, seriesMap, limitMap, selectedSeriesId },
    userActions: { updateLimit },
  } = useContext(UserContext);

  const vaultBase: IAsset | undefined = assetMap.get(vault?.baseId!);
  const selectedSeries: ISeries | undefined = seriesMap.get(selectedSeriesId!);

  /* LOCAL STATE */
  const [borrowEstimate, setBorrowEstimate] = useState<BigNumber>(ethers.constants.Zero);
  const [borrowEstimate_, setBorrowEstimate_] = useState<string>();

  const [minAllowedBorrow, setMinAllowedBorrow] = useState<string | undefined>();
  const [maxAllowedBorrow, setMaxAllowedBorrow] = useState<string | undefined>();
  const [borrowPossible, setBorrowPossible] = useState<boolean>(false);

  const [maxRepay, setMaxRepay] = useState<BigNumber>(ethers.constants.Zero);
  const [maxRepay_, setMaxRepay_] = useState<string | undefined>();
  const [maxRepayDustLimit, setMaxRepayDustLimit] = useState<string | undefined>();

  const [maxRoll, setMaxRoll] = useState<BigNumber>(ethers.constants.Zero);
  const [maxRoll_, setMaxRoll_] = useState<string | undefined>();
  const [rollPossible, setRollPossible] = useState<boolean>(false);

  const [userBaseAvailable, setUserBaseAvailable] = useState<BigNumber>(ethers.constants.Zero);
  const [userBaseAvailable_, setUserBaseAvailable_] = useState<string | undefined>();
  const [protocolBaseAvailable, setProtocolBaseAvailable] = useState<BigNumber>(ethers.constants.Zero);

  const [maxDebt_, setMaxDebt_] = useState<string | undefined>();

  /* Update the borrow limits if ilk or base changes */
  useEffect(() => {
    if (limitMap.get(selectedBaseId)?.has(selectedIlkId)) {
      const _limit = limitMap.get(selectedBaseId).get(selectedIlkId); // get the limit from the map
      setMinAllowedBorrow(_limit[1].toString());
      setMaxAllowedBorrow(_limit[0].toString());
      console.log('Cached:', 'MIN LIMIT:', _limit[1].toString(), 'MAX LIMIT:', _limit[0].toString());
    } else {
      (async () => {
        if (selectedIlkId && selectedBaseId) {
          /* Update Price before setting */
          const _limit = await updateLimit(selectedBaseId, selectedIlkId);
          setMinAllowedBorrow(_limit[1].toString());
          setMaxAllowedBorrow(_limit[0].toString());
          console.log('External call:', 'MIN LIMIT:', _limit[1].toString(), 'MAX LIMIT:', _limit[0].toString());
        }
      })();
    }
  }, [limitMap, selectedBaseId, selectedIlkId, updateLimit]);

  /* check if the user can borrow the specified amount based on protocol base reserves */
  useEffect(() => {
    if (input && selectedSeries && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, selectedSeries?.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, selectedSeries?.decimals);
      input_.lte(selectedSeries?.baseReserves!) ? setBorrowPossible(true) : setBorrowPossible(false);
    }
  }, [input, selectedSeries]);

  /* calculate an estimated sale based on the input and future stragey, assuming correct collateralisation */
  useEffect(() => {
    if (input && futureSeries && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, futureSeries?.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, futureSeries?.decimals);
      const estimate = sellBase(
        futureSeries.baseReserves,
        futureSeries.fyTokenReserves,
        input_,
        futureSeries.getTimeTillMaturity(),
        futureSeries.decimals
      );
      setBorrowEstimate(estimate);
      setBorrowEstimate_(ethers.utils.formatUnits(estimate, futureSeries.decimals).toString());
    }
  }, [input, futureSeries]);

  /* Check if the rollToSeries have sufficient base value */
  useEffect(() => {
    if (futureSeries && vault) {
      setMaxRoll(futureSeries.baseReserves);
      setMaxRoll_(ethers.utils.formatUnits(futureSeries.baseReserves, futureSeries.decimals).toString());
      setRollPossible(vault.art?.lt(futureSeries.baseReserves));

      if (vault.art?.lt(futureSeries.baseReserves)) {
        setMaxRoll(vault.art);
        setMaxRoll_(ethers.utils.formatUnits(vault.art, futureSeries.decimals).toString());
      }
    }
  }, [futureSeries, vault]);

  /* Update the min max repayable amounts */
  useEffect(() => {
    if (activeAccount && vault && vaultBase) {
      const minDebt = ethers.utils.parseUnits('0.5', vaultBase?.decimals);
      const vaultSeries: ISeries = seriesMap.get(vault?.seriesId!);

      (async () => {
        const _maxToken = await vaultBase?.getBalance(activeAccount);
        const _maxDebt = vault.art;
        setMaxDebt_(ethers.utils.formatUnits(vault.art, vaultBase.decimals));

        /* max user is either the max tokens they have or max debt */
        const _maxUser = _maxToken && _maxDebt?.gt(_maxToken) ? _maxToken : _maxDebt;
        const _maxDust = _maxUser.sub(minDebt);
        const _maxBaseIn = maxBaseIn(
          vaultSeries.baseReserves,
          vaultSeries.fyTokenReserves,
          vaultSeries.getTimeTillMaturity(),
          vaultSeries.decimals
        );

        /* set the dust limit */
        _maxDust && setMaxRepayDustLimit(ethers.utils.formatUnits(_maxDust, vaultBase?.decimals)?.toString());
        _maxBaseIn && setProtocolBaseAvailable(_maxBaseIn);

        /* set the maxBase available for both user and protocol */
        if (_maxUser) {
          setUserBaseAvailable(_maxUser);
          setUserBaseAvailable_(ethers.utils.formatUnits(_maxUser, vaultBase.decimals!).toString());
        }

        /* set the maxRepay as the biggest of the two, human readbale and BN */
        if (_maxUser && _maxBaseIn && _maxUser.gt(_maxBaseIn)) {
          setMaxRepay_(ethers.utils.formatUnits(_maxBaseIn, vaultBase?.decimals)?.toString());
          setMaxRepay(_maxBaseIn);
        } else {
          setMaxRepay_(ethers.utils.formatUnits(_maxUser, vaultBase?.decimals)?.toString());
          setMaxRepay(_maxUser);
        }
      })();
    }
  }, [activeAccount, seriesMap, vault, vaultBase]);

  return {
    borrowEstimate,
    borrowEstimate_,

    minAllowedBorrow,
    maxAllowedBorrow,
    borrowPossible,

    maxRepay_,
    maxRepay,

    maxRoll,
    maxRoll_,
    rollPossible,

    maxRepayDustLimit,

    userBaseAvailable,
    protocolBaseAvailable,
    userBaseAvailable_,

    maxDebt_,
  };
};

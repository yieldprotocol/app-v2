import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { IVault, ISeries, IAsset } from '../../types';

import { maxBaseToSpend } from '../../utils/yieldMath';

/* Collateralisation hook calculates collateralisation metrics */
export const useBorrowHelpers = (
  input: string | undefined,
  collateralInput: string | undefined,
  vault: IVault | undefined,
  rollToSeries: ISeries | undefined = undefined
) => {
  /* STATE FROM CONTEXT */
  const {
    userState: { activeAccount, selectedBaseId, selectedIlkId, assetMap, seriesMap },
  } = useContext(UserContext);

  const vaultBase: IAsset | undefined = assetMap.get(vault?.baseId!);

  /* LOCAL STATE */
  const [minAllowedBorrow, setMinAllowedBorrow] = useState<string | undefined>();
  const [maxAllowedBorrow, setMaxAllowedBorrow] = useState<string | undefined>();

  const [maxRepay, setMaxRepay] = useState<BigNumber>(ethers.constants.Zero);
  const [maxRepay_, setMaxRepay_] = useState<string | undefined>();
  const [maxRepayDustLimit, setMaxRepayDustLimit] = useState<string | undefined>();

  const [maxRoll, setMaxRoll] = useState<BigNumber>(ethers.constants.Zero);
  const [maxRoll_, setMaxRoll_] = useState<string | undefined>();
  const [rollPossible, setRollPossible] = useState<boolean>(false);

  const [userBaseAvailable, setUserBaseAvailable] = useState<BigNumber>(ethers.constants.Zero);
  const [userBaseAvailable_, setUserBaseAvailable_] = useState<string | undefined>();
  const [protocolBaseAvailable, setProtocolBaseAvailable] = useState<BigNumber>(ethers.constants.Zero);

  /* update the minimum maxmimum allowable debt */
  useEffect(() => {
    setMinAllowedBorrow('0.5');
    setMaxAllowedBorrow('1000000');
  }, [selectedBaseId, selectedIlkId]);

  /* check if the rollToSeries have sufficient base value */
  useEffect(() => {
    if (rollToSeries && vault) {
      const _maxProtocol = maxBaseToSpend(
        rollToSeries.baseReserves,
        rollToSeries.fyTokenReserves,
        rollToSeries.getTimeTillMaturity()
      );
      const rollable = _maxProtocol.gte(vault.art);
      rollable && console.log('roll possible');
      setMaxRoll(_maxProtocol);
      setMaxRoll_(ethers.utils.formatUnits(_maxProtocol, rollToSeries.decimals).toString());
      setRollPossible(true);
    }
  }, [rollToSeries, vault]);

  /* update the min max repayable or rollable */
  useEffect(() => {
    if (activeAccount && vault && vaultBase) {
      const vaultSeries: ISeries = seriesMap.get(vault?.seriesId!);
      const minDebt = ethers.utils.parseUnits('0.5', vaultBase?.decimals);

      (async () => {
        const _maxToken = await vaultBase?.getBalance(activeAccount);
        const _maxDebt = vault.art;

        /* max user is either the max tokens they have or max debt */
        const _maxUser = _maxToken && _maxDebt?.gt(_maxToken) ? _maxToken : _maxDebt;
        const _maxDust = _maxUser.sub(minDebt);

        const _maxProtocol = maxBaseToSpend(
          vaultSeries.baseReserves,
          vaultSeries.fyTokenReserves,
          vaultSeries.getTimeTillMaturity()
        );

        /* The the dust limit */
        _maxDust && setMaxRepayDustLimit(ethers.utils.formatUnits(_maxDust, vaultBase?.decimals)?.toString());
        _maxProtocol && setProtocolBaseAvailable(_maxProtocol);

        /* set the maxBase available for both user and protocol */
        if (_maxUser) {
          setUserBaseAvailable(_maxUser);
          setUserBaseAvailable_(ethers.utils.formatUnits(_maxUser, vaultBase.decimals!).toString());
        }

        /* set the maxRepay as the biggest of the two, human readbale and BN */
        if (_maxUser && _maxProtocol && _maxUser.gt(_maxProtocol)) {
          setMaxRepay_(ethers.utils.formatUnits(_maxProtocol, vaultBase?.decimals)?.toString());
          setMaxRepay(_maxProtocol);
        } else {
          setMaxRepay_(ethers.utils.formatUnits(_maxUser, vaultBase?.decimals)?.toString());
          setMaxRepay(_maxUser);
        }
      })();
    }
  }, [activeAccount, seriesMap, vault, vaultBase]);

  return {
    minAllowedBorrow,
    maxAllowedBorrow,

    maxRepay_,
    maxRepay,

    maxRoll,
    maxRoll_,
    rollPossible,

    maxRepayDustLimit,

    userBaseAvailable,
    protocolBaseAvailable,
    userBaseAvailable_,
  };
};

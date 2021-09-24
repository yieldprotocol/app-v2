import { BigNumber, BigNumberish, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
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
    userState: { activeAccount, selectedBaseId, selectedIlkId, assetMap, seriesMap },
  } = useContext(UserContext);

  const vaultBase: IAsset | undefined = assetMap.get(vault?.baseId!);

  /* LOCAL STATE */
  const [minAllowedBorrow, setMinAllowedBorrow] = useState<string | undefined>();
  const [maxAllowedBorrow, setMaxAllowedBorrow] = useState<string | undefined>();

  const [maxRepayOrRoll, setMaxRepayOrRoll] = useState<string | undefined>();
  const [maxRepayDustLimit, setMaxRepayDustLimit] = useState<string | undefined>();

  const [maxAsBn, setMaxAsBn] = useState<BigNumber>(ethers.constants.Zero);
  const [userBaseAvailable, setUserBaseAvailable] = useState<BigNumber>(ethers.constants.Zero);
  const [protocolBaseAvailable, setProtocolBaseAvailable] = useState<BigNumber>(ethers.constants.Zero);

  /* update the minimum maxmimum allowable debt */
  useEffect(() => {
    setMinAllowedBorrow('0.5');
    setMaxAllowedBorrow('1000000');
  }, [selectedBaseId, selectedIlkId]);

  /* update the min max repayable or rollable */
  useEffect(() => {
    if (activeAccount && vault && vaultBase) {
      const vaultSeries: ISeries = seriesMap.get(vault?.seriesId!);
      const minDebt = ethers.utils.parseUnits('0.5', vaultBase?.decimals);
      (async () => {
        const _maxToken = await vaultBase?.getBalance(activeAccount);
        const _maxDebt = vault.art;
        /* max user is either the max tokens they have or max debt */
        const _maxUser = _maxToken && _maxDebt.gt(_maxToken) ? _maxToken : _maxDebt;
        const _maxDust = _maxUser.sub(minDebt);
        const _maxProtocol = vaultSeries?.fyTokenReserves.sub(vaultSeries?.baseReserves).div(2);

        /* the the dust limit */
        _maxDust && setMaxRepayDustLimit(ethers.utils.formatUnits(_maxDust, vaultBase?.decimals)?.toString());
        /* set the maxBas available for both user and protocol */
        _maxUser && setUserBaseAvailable(_maxUser);
        _maxProtocol && setProtocolBaseAvailable(_maxProtocol);

        /* set the maxRepay as the buggest of the two, human readbale */
        _maxUser && _maxProtocol && _maxUser.gt(_maxProtocol)
          ? setMaxRepayOrRoll(ethers.utils.formatUnits(_maxProtocol, vaultBase?.decimals)?.toString())
          : setMaxRepayOrRoll(ethers.utils.formatUnits(_maxUser, vaultBase?.decimals)?.toString());

        /* set the maxRepay as the buggest of the two, human readbale */
        _maxUser && _maxProtocol && _maxUser.gt(_maxProtocol)
          ? setMaxAsBn(_maxProtocol)
          : setMaxAsBn(_maxUser);
          
      })();
    }
  }, [activeAccount, seriesMap, vault, vaultBase]);

  return {
    minAllowedBorrow,
    maxAllowedBorrow,
    maxRepayOrRoll,
    maxRepayDustLimit,

    maxAsBn,

    userBaseAvailable,
    protocolBaseAvailable,
  };
};

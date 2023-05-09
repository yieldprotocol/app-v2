import { useContext, useMemo } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import { ActionType } from '../../../types';
import { useApr } from '../../useApr';
import { Address, useBalance } from 'wagmi';
import { WETH } from '../../../config/assets';
import useAccountPlus from '../../useAccountPlus';
import { formatUnits } from 'ethers/lib/utils.js';
import useVYTokenBaseVal from '../../entities/useVYTokenBaseVal';
import useVYTokens from '../../entities/useVYTokens';

export const useLendHelpersVR = (vyTokenAddress: string | undefined, input?: string) => {
  const {
    userState: { selectedBase },
  } = useContext(UserContext);

  const { address: account } = useAccountPlus();

  const { data: baseBal } = useBalance({
    address: account,
    token: selectedBase?.proxyId === WETH ? undefined : (selectedBase?.address as Address),
    enabled: !!selectedBase,
  });

  const { data: vyTokens } = useVYTokens();
  const vyToken = vyTokens?.get(vyTokenAddress!);
  const { data: vyTokenBaseVal } = useVYTokenBaseVal(vyToken?.proxyAddress);

  const { apr: apy } = useApr(input, ActionType.LEND, null); // TODO - handle vr apy's

  const maxClose = useMemo(() => {
    if (vyTokenBaseVal && baseBal) {
      return baseBal.value.lt(vyTokenBaseVal) ? baseBal.value : vyTokenBaseVal;
    }

    return vyTokenBaseVal;
  }, [baseBal, vyTokenBaseVal]);

  return {
    maxLend: baseBal?.value,
    maxLend_: baseBal?.formatted,
    maxClose,
    maxClose_: maxClose ? formatUnits(maxClose, vyToken?.decimals) : undefined,
    apy,
    vyTokenBaseVal,
    vyTokenBaseVal_: vyTokenBaseVal ? formatUnits(vyTokenBaseVal, vyToken?.decimals) : undefined,
    userBaseBalance: baseBal?.value,
    userBaseBalance_: baseBal?.formatted,
  };
};

import { useContext, useMemo } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import { ActionType } from '../../../types';
import { useApr } from '../../useApr';
import { useAprVR } from '../../useAprVR';
import { Address, useBalance } from 'wagmi';
import { WETH } from '../../../config/assets';
import useAccountPlus from '../../useAccountPlus';
import { formatUnits } from 'ethers/lib/utils.js';
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

  const { apr: apy } = useAprVR(input ? input : vyToken?.balance_, ActionType.LEND); // TODO - handle vr apy's

  return {
    maxLend: baseBal?.value,
    maxLend_: baseBal?.formatted,
    maxClose: vyToken?.vyTokenBaseVal,
    maxClose_: vyToken?.vyTokenBaseVal ? formatUnits(vyToken.vyTokenBaseVal, vyToken?.decimals) : undefined,
    apy,
    userBaseBalance: baseBal?.value,
    userBaseBalance_: baseBal?.formatted,
  };
};

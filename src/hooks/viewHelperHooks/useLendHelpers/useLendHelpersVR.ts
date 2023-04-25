import { useContext, useState } from 'react';
import { SettingsContext } from '../../../contexts/SettingsContext';
import { UserContext } from '../../../contexts/UserContext';
import { ActionType } from '../../../types';
import { useApr } from '../../useApr';
import { Address, useBalance } from 'wagmi';
import { WETH } from '../../../config/assets';
import useAccountPlus from '../../useAccountPlus';

export const useLendHelpersVR = (input: string) => {
  const {
    userState: { selectedBase },
  } = useContext(UserContext);

  const { address: account } = useAccountPlus();
  const { data: baseBal } = useBalance({
    address: account,
    token: selectedBase?.proxyId === WETH ? undefined : (selectedBase?.address as Address),
    enabled: !!selectedBase,
  });

  const { apr: apy } = useApr(input, ActionType.LEND, null); // TODO - handle vr apy's

  const [marketValue, setMarketValue] = useState<string>(); // the value of vyToken position in base

  const { data: vyTokenbalance } = useBalance({
    address: account,
    token: selectedBase?.VYTokenProxyAddress as Address,
    enabled: !!selectedBase,
  });

  return {
    maxLend: baseBal?.value,
    maxLend_: baseBal?.formatted,
    maxClose: vyTokenbalance?.value,
    maxClose_: vyTokenbalance?.formatted,
    apy,
    marketValue,
    userBaseBalance: baseBal?.value,
    userBaseBalance_: baseBal?.formatted,
  };
};

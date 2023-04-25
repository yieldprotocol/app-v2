import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { SettingsContext } from '../../../contexts/SettingsContext';
import { UserContext } from '../../../contexts/UserContext';
import { ActionType } from '../../../types';
import { ZERO_BN } from '../../../utils/constants';
import { useApr } from '../../useApr';
import { Address, useBalance } from 'wagmi';
import { cleanValue } from '../../../utils/appUtils';
import { WETH } from '../../../config/assets';
import useAccountPlus from '../../useAccountPlus';

export const useLendHelpersVR = (input: string) => {
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const { userState } = useContext(UserContext);
  const { selectedBase } = userState;

  const { address: account } = useAccountPlus();

  /* Position state */
  const [maxClose, setMaxClose] = useState<BigNumber>();
  const [maxClose_, setMaxClose_] = useState<string>();
  const [marketValue, setMarketValue] = useState<string>(); // the value of vyToken position in base

  /* Roll state */
  const [maxRoll, setMaxRoll] = useState<BigNumber>(ethers.constants.Zero);
  const [maxRoll_, setMaxRoll_] = useState<string>();

  const { apr: apy } = useApr(input, ActionType.LEND, null); // TODO - handle vr apy's
  const { data: baseBal } = useBalance({
    address: account,
    token: selectedBase?.proxyId === WETH ? undefined : (selectedBase?.address as Address),
    enabled: !!selectedBase,
  });

  const userBaseBalance = baseBal?.value;
  const userBaseBalance_ = baseBal?.formatted;

  const { data: vyTokenbalance } = useBalance({
    address: account,
    token: selectedBase?.VYTokenProxyAddress as Address,
    enabled: !!selectedBase,
  });

  /* max close is the vyToken balance */
  useEffect(() => {
    setMaxClose(vyTokenbalance?.value);
    setMaxClose_(vyTokenbalance?.formatted);
  }, [vyTokenbalance?.formatted, vyTokenbalance?.value]);

  return {
    maxClose,
    maxClose_,
    apy,
    marketValue,
    userBaseBalance,
    userBaseBalance_,
  };
};

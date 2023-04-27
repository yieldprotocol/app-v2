import { useContext, useState, useEffect } from 'react';
import { SettingsContext } from '../../../contexts/SettingsContext';
import { UserContext } from '../../../contexts/UserContext';
import { ActionType } from '../../../types';
import { useApr } from '../../useApr';
import { Address, useBalance, useProvider } from 'wagmi';
import { WETH } from '../../../config/assets';
import useAccountPlus from '../../useAccountPlus';
import { useConvertValue } from '../../useConvertValue';

export const useLendHelpersVR = (input?: string) => {
  const {
    userState: { selectedBase },
  } = useContext(UserContext);

  const { address: account } = useAccountPlus();
  const { data: baseBal } = useBalance({
    address: account,
    token: selectedBase?.proxyId === WETH ? undefined : (selectedBase?.address as Address),
    enabled: !!selectedBase,
  });

  const { convertValue } = useConvertValue();

  const { apr: apy } = useApr(input, ActionType.LEND, null); // TODO - handle vr apy's

  const [marketValue, setMarketValue] = useState<string>(); // the value of vyToken position in base

  async function fetchMarketValue() {
    // TODO - obviously we don't want to hardcode this, but we are limited
    // by having very few spotOracles on the VRCauldron in this fork
    const value = await convertValue(selectedBase!.id, '0x313800000000', input);
    setMarketValue(value.toString());
    console.log('marketValue', value.toString());
  }
  useEffect(() => {
    if (selectedBase?.id) {
      fetchMarketValue();
    }
  }, [convertValue, input, selectedBase]);

  const { data: vyTokenbalance } = useBalance({
    address: account,
    token: selectedBase?.VYTokenProxyAddress as Address,
    enabled: !!selectedBase,
  });

  // TODO - vyTokenBalance.formatted is not correct

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

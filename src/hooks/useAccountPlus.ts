import { GetAccountResult } from '@wagmi/core';
import { Provider, useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { SettingsContext } from '../contexts/SettingsContext';

/**
 * Uses the connected chain or the default network, to only be used when fetching data
 * @returns chain id to use when fetching data
 */
const useAccountPlus = () => {
  const { settingsState } = useContext(SettingsContext);
  const { mockUserAddress, useMockedUser } = settingsState;

  const data = useAccount();
  const [userData, setUserData] = useState<any>(data);

  useEffect(() => {
    if (useMockedUser) {
      console.log('useAccountPlus >>>  mockUser: ' + mockUserAddress);
      setUserData({ ...data, address: mockUserAddress, isConnected: true, connector: undefined });
    }
  }, [useMockedUser]);

  return userData;
};

export default useAccountPlus;

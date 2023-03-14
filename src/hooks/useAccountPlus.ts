import { useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { SettingsContext } from '../contexts/SettingsContext';

/**
 * Uses the connected chain or the default network, to only be used when fetching data
 * @returns account when using mocked data, else simply the useAccount hook
 */
const useAccountPlus = () => {
  const { settingsState } = useContext(SettingsContext);
  const { mockUserAddress, useMockedUser } = settingsState;

  const data = useAccount();
  const [userData, setUserData] = useState<any>(data);

  useEffect(() => {
    if (useMockedUser === true && mockUserAddress != undefined) {
      console.log('useAccountPlus hook >>>  Mocking User: ' + mockUserAddress);
      setUserData({ ...data, address: mockUserAddress, connector: undefined });
    }
  }, [useMockedUser, mockUserAddress]);

  return useMockedUser ? userData: data;
};

export default useAccountPlus;

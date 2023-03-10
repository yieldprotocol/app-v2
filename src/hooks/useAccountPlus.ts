import {useContext, useEffect, useState } from 'react';
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
  const [ userData, setUserData ] = useState<any>({address:undefined});

  useEffect(() => {
    if (useMockedUser === true) {
      console.log('useAccountPlus >>>  mockUser: ' + mockUserAddress);
      setUserData({ ...data, address: mockUserAddress, isConnected: true, connector: undefined, mocked: true });
    } 
  }, [useMockedUser]);

  return (useMockedUser === true ? userData : data);
  
};

export default useAccountPlus;

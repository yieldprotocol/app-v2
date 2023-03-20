import { useContext, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { SettingsContext } from '../contexts/SettingsContext';

/**
 * Uses the connected chain or the default network, to only be used when fetching data
 * @returns mockUserAddress input when using mocked data, else simply the wagmi useAccount hook address
 */
const useAccountPlus = () => {
  const {
    settingsState: { useMockedUser, mockUserAddress },
  } = useContext(SettingsContext);
  const { address } = useAccount();

  return useMemo(
    () => (useMockedUser ? { address: mockUserAddress } : { address }),
    [address, mockUserAddress, useMockedUser]
  );
};

export default useAccountPlus;

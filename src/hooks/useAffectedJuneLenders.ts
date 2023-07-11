import { useCallback } from 'react';
import data from '../config/affectedJuneLenders.json';

type AddressData = {
  fyTokenAddr: string;
  account: string;
  AmountFmt: number;
  Amount: number;
};

type UserAddressStatus = {
  found: boolean;
  fyTokenAddr?: string;
};

const useAffectedJuneLenders = (): ((userAddress: string) => UserAddressStatus) => {
  // parse the JSON into a Map for fast lookup
  const addressDataMap: Map<string, AddressData> = new Map(data.map((item: AddressData) => [item.account, item]));

  const checkIfAffectedJuneLender = useCallback(
    (userAddress: string): UserAddressStatus => {
      const foundData = addressDataMap.get(userAddress);
      return foundData ? { found: true, fyTokenAddr: foundData.fyTokenAddr } : { found: false };
    },
    [addressDataMap]
  );

  return checkIfAffectedJuneLender;
};

export default useAffectedJuneLenders;

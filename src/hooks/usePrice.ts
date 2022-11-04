import { bytesToBytes32, decimal18ToDecimalN, decimalNToDecimal18, WAD_BN } from '@yield-protocol/ui-math';
import { BigNumber } from 'ethers';
import { useContext, useMemo } from 'react';
import { useContractRead } from 'wagmi';
import { ORACLE_INFO } from '../config/oracles';
import { UserContext } from '../contexts/UserContext';
import useChainId from './useChainId';
import useContracts from './useContracts';

/**
 * Gets a pair's (base/ilk) price from the relevant oracle
 */
const usePrice = (baseId: string, ilkId: string) => {
  const {
    userState: { assetMap },
  } = useContext(UserContext);

  const chainId = useChainId();
  const contracts = useContracts();
  const oracleName = ORACLE_INFO.get(chainId)?.get(baseId)?.get(ilkId);
  const oracle = contracts.get(oracleName!);
  const base = assetMap.get(baseId);
  const ilk = assetMap.get(ilkId);

  const { data, isLoading } = useContractRead({
    addressOrName: oracle?.address!,
    contractInterface: oracle?.interface!,
    functionName: 'peek',
    args: [bytesToBytes32(ilkId, 6), bytesToBytes32(baseId, 6), decimal18ToDecimalN(WAD_BN, ilk?.decimals!)],
    enabled: !!oracle && !!base && !!ilk,
  });

  // first item in data is the price
  const price = useMemo(
    () => (data ? decimalNToDecimal18(data[0] as BigNumber, base?.decimals!) : undefined),
    [base?.decimals, data]
  );

  return { data: price, isLoading };
};

export default usePrice;

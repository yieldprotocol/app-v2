import { bytesToBytes32, decimal18ToDecimalN, WAD_BN } from '@yield-protocol/ui-math';
import { BigNumber } from 'ethers';
import { useContext } from 'react';
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

  return { data: data ? (data[0] as BigNumber) : undefined, isLoading };
};

export default usePrice;

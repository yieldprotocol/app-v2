import { ReadContractsContract } from '@wagmi/core/dist/declarations/src/actions/contracts/readContracts';
import { BigNumber, ethers } from 'ethers';
import { formatUnits, Result } from 'ethers/lib/utils';
import { useContext, useMemo } from 'react';
import { useAccount, useContractReads } from 'wagmi';
import { UserContext } from '../contexts/UserContext';
import { IAsset } from '../types';

/**
 * Gets all asset balances
 * @returns assetMap values with balance added
 */

const useBalances = () => {
  const {
    userState: { assetMap },
  } = useContext(UserContext);

  const { address: account } = useAccount();

  // data to read
  const contracts = useMemo(
    () =>
      [...assetMap.values()].map((a) => ({
        addressOrName: a.address,
        args: a.tokenIdentifier ? [account, a.tokenIdentifier] : [account], // handle erc1155 tokens with tokenIdentifier
        functionName: 'balanceOf',
        contractInterface: a.assetContract.interface,
      })) as ReadContractsContract[],

    [account, assetMap]
  );

  /**
   * Note:
   * wagmi sends back null values if no wallet connected.
   * So in that case, we send in an empty array from 'contracts' above ^ to avoid multiple failed wagmi calls.
   *
   * (its done above becasue we cant use hooks 'conditionally' )
   * */
  const { data, isLoading, refetch } = useContractReads({ contracts, enabled: !!account });

  // copy of asset map with bal
  const _data = useMemo(
    () =>
      [...assetMap.values()].map(
        (a, i) =>
          ({
            ...a,
            balance: data && !!data[i] ? (data[i] as BigNumber[]) : ethers.constants.Zero,
            balance_: data && !!data[i] ? formatUnits(data[i], a.decimals) : '0',
          } as IAsset)
      ),
    [assetMap, data]
  );
  return { data: _data, isLoading, refetch };
};

export default useBalances;

import { useContext } from 'react';
import { IAsset, IAssetPair, IAssetRoot } from '../types';
import { BigNumber, ethers } from 'ethers';
import useSWRImmutable from 'swr/immutable';
import { useAccount, useChainId } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';

import { bytesToBytes32, decimal18ToDecimalN, WAD_BN } from '@yield-protocol/ui-math';
import { ORACLE_INFO } from '../config/oracles';
import useContracts, { ContractNames } from './useContracts';

/* Generic hook for chain transactions */
// export const useAssetPair_ = (base?: IAsset, collateral?: IAsset): IAssetPair | undefined => {
//   const {
//     priceState: { pairMap, pairLoading },
//     priceActions: { updateAssetPair },
//   } = useContext(PriceContext) as IPriceContext;

//   /* LOCAL STATE */
//   const [assetPair, setAssetPair] = useState<IAssetPair>();

//   useEffect(() => {
//     if (base && collateral) {
//       pairMap.has(base.proxyId + collateral.proxyId) && setAssetPair(pairMap.get(base.proxyId + collateral.proxyId));
//       !pairMap.has(base.proxyId + collateral.proxyId) &&
//         !pairLoading.includes(base.proxyId + collateral.proxyId) &&
//         updateAssetPair(base.proxyId, collateral.proxyId);
//     }
//   }, [base, collateral, pairMap, pairLoading]);

//   return assetPair;
// };

export const useAssetPair = (base?: IAsset|IAssetRoot, ilk?: IAsset|IAssetRoot) => {
  
  /* HOOKS */
  const chainId = useChainId();
  const contracts = useContracts();
  const Cauldron = contracts.get(ContractNames.CAULDRON);

  /* LOCAL STATE */
  const pairId = base && ilk ? `${base.id}${ilk.id}` : null;

  /* GET PAIR INFO */
  const getAssetPair = 
    async (): Promise<IAssetPair | null> => {

      const oracleName = ORACLE_INFO.get(chainId)?.get(base!.id)?.get(ilk!.id);
      const PriceOracle = contracts.get(oracleName!);

      /* if all the parts are there update the pairInfo */
      if (Cauldron && PriceOracle && base && ilk ) {
  
        console.log('Getting Asset Pair Info: ', bytesToBytes32(base.id, 6), bytesToBytes32(ilk.id, 6));

        /* Get debt params and spot ratios */
        const [{ max, min, sum, dec }, { ratio }] = await Promise.all([
          Cauldron.debt(base.id, ilk.id),
          Cauldron.spotOracles(base.id, ilk.id),
        ]);

        /* get pricing if available */
        let price: BigNumber;
        try {
          // eslint-disable-next-line prefer-const
          [price] = await PriceOracle.peek(
            bytesToBytes32(ilk.id, 6),
            bytesToBytes32(base.id, 6),
            decimal18ToDecimalN(WAD_BN, ilk.decimals!)
          );
        } catch (error) {
          console.log('Error getting pricing for: ', bytesToBytes32(base.id, 6), bytesToBytes32(ilk.id, 6), error);
          price = ethers.constants.Zero;
        };

        return  {
          baseId: base.id,
          ilkId: ilk.id,
          limitDecimals: dec,
          minDebtLimit: BigNumber.from(min).mul(BigNumber.from('10').pow(dec)), // NB use limit decimals here > might not be same as base/ilk decimals
          maxDebtLimit: max.mul(BigNumber.from('10').pow(dec)), // NB use limit decimals here > might not be same as base/ilk decimals
          pairTotalDebt: sum,
          pairPrice: price, // value of 1 ilk (1x10**n) in terms of base.
          minRatio: parseFloat(ethers.utils.formatUnits(ratio, 6)), // pre-format ratio
          baseDecimals: base.decimals!,
          oracle: oracleName || '',
        };
      }
      return null;
    };

  const key = ['assetPair', pairId];

  const { data, error } = useSWRImmutable(key, getAssetPair);

  return {
    data,
    isLoading: !data && !error,
    key,
  };
};

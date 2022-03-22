import React, { useCallback, useContext, useState } from 'react';
import { BigNumber, ethers } from 'ethers';

import { IAssetPair, IChainContext, IPriceContextState, ISettingsContext } from '../types';

import { ChainContext } from './ChainContext';
import { bytesToBytes32, decimal18ToDecimalN } from '../utils/yieldMath';

import { WAD_BN } from '../utils/constants';
import { SettingsContext } from './SettingsContext';
import { ORACLE_INFO } from '../config/oracles';

const PriceContext = React.createContext<any>({});

const PriceProvider = ({ children }: any) => {
  /* STATE FROM CONTEXT */
  const { chainState } = useContext(ChainContext) as IChainContext;
  const {
    contractMap,
    connection: { fallbackChainId },
    assetRootMap,
  } = chainState;

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext) as ISettingsContext;

  /* LOCAL STATE */
  const [pairLoading, setPairLoading] = useState([] as string[]);
  const [pairMap, setPairMap] = useState(new Map() as Map<string, IAssetPair>);
   
  const updateAssetPair = useCallback ( async (baseId: string, ilkId: string) => {
    
    diagnostics && console.log('Prices currently being fetched: ', pairLoading);
    const pairId = `${baseId}${ilkId}`;

    setPairLoading([...pairLoading, pairId]);

    const Cauldron = contractMap.get('Cauldron');
    const oracleName = ORACLE_INFO.get(fallbackChainId || 1)
      ?.get(baseId)
      ?.get(ilkId);

    const PriceOracle = contractMap.get(oracleName!);
    const base = assetRootMap.get(baseId);
    const ilk = assetRootMap.get(ilkId);

    diagnostics && console.log('Getting Asset Pair Info: ', bytesToBytes32(baseId, 6), bytesToBytes32(ilkId, 6));

    // /* Get debt params and spot ratios */
    const [{ max, min, sum, dec }, { ratio }] = await Promise.all([
      Cauldron?.debt(baseId, ilkId),
      Cauldron?.spotOracles(baseId, ilkId),
    ]);

    /* get pricing if available */
    let price: BigNumber;
    try {
      // eslint-disable-next-line prefer-const
      [price] = await PriceOracle?.peek(
        bytesToBytes32(ilkId, 6),
        bytesToBytes32(baseId, 6),
        decimal18ToDecimalN(WAD_BN, ilk?.decimals!)
      );
      diagnostics &&
        console.log(
          'Price fetched:',
          decimal18ToDecimalN(WAD_BN, ilk?.decimals!).toString(),
          ilkId,
          'for',
          price.toString(),
          baseId
        );
    } catch (error) {
      diagnostics &&
        console.log('Error getting pricing for: ', bytesToBytes32(baseId, 6), bytesToBytes32(ilkId, 6), error);
      price = ethers.constants.Zero;
    }

    const newPair: IAssetPair = {
      baseId,
      ilkId,
      limitDecimals: dec,
      minDebtLimit: BigNumber.from(min).mul(BigNumber.from('10').pow(dec)), // NB use limit decimals here > might not be same as base/ilk decimals
      maxDebtLimit: max.mul(BigNumber.from('10').pow(dec)), // NB use limit decimals here > might not be same as base/ilk decimals
      pairTotalDebt: sum,
      pairPrice: price, // value of 1 ilk (1x10**n) in terms of base.
      minRatio: parseFloat(ethers.utils.formatUnits(ratio, 6)), // pre-format ratio
      baseDecimals: base?.decimals!,
      oracle: oracleName || '',
    };

    pairMap.set(pairId, newPair);
    setPairMap(pairMap);
    setPairLoading(pairLoading.filter((s: string) => s === pairId));
  }, 
  [assetRootMap, contractMap, diagnostics, fallbackChainId, pairLoading, pairMap]);

  return (
    <PriceContext.Provider value={{ pairMap, pairLoading, updateAssetPair } as IPriceContextState}>
      {children}
    </PriceContext.Provider>
  );
};

export { PriceContext, PriceProvider };

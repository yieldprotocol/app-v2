import React, { useCallback, useContext, useReducer } from 'react';
import { BigNumber, ethers } from 'ethers';

import { useNetwork } from 'wagmi';
import { IAssetPair, IChainContext, IPriceContextState, ISettingsContext } from '../types';

import { ChainContext } from './ChainContext';
import { bytesToBytes32, decimal18ToDecimalN } from '../utils/yieldMath';

import { WAD_BN } from '../utils/constants';
import { SettingsContext } from './SettingsContext';
import { ORACLE_INFO } from '../config/oracles';

enum PriceState {
  UPDATE_PAIR = 'updatePair',
  START_PAIR_FETCH = 'startPairFetch',
  END_PAIR_FETCH = 'endPairFetch',
}

const PriceContext = React.createContext<any>({});

const initState: IPriceContextState = {
  pairMap: new Map() as Map<string, IAssetPair>,
  pairLoading: [] as string[],
};

const priceReducer = (state: IPriceContextState, action: any) => {
  /* Reducer switch */
  switch (action.type) {
    case PriceState.UPDATE_PAIR:
      return {
        ...state,
        pairMap: new Map(state.pairMap.set(action.payload.pairId, action.payload.pairInfo)),
      };
    case PriceState.START_PAIR_FETCH:
      return {
        ...state,
        pairLoading: [...state.pairLoading, action.payload],
      };
    case PriceState.END_PAIR_FETCH:
      return {
        ...state,
        pairLoading: state.pairLoading.filter((s: string) => s === action.payload),
      };
    default:
      return state;
  }
};

const PriceProvider = ({ children }: any) => {
  /* STATE FROM CONTEXT */
  const { chainState } = useContext(ChainContext) as IChainContext;
  const { contractMap, assetRootMap } = chainState;

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext) as ISettingsContext;

  const { activeChain } = useNetwork();
  const fallbackChainId = activeChain?.id;

  /* LOCAL STATE */
  const [priceState, updateState] = useReducer(priceReducer, initState);

  const updateAssetPair = useCallback(
    async (baseId: string, ilkId: string): Promise<IAssetPair | null> => {
      diagnostics && console.log('Prices currently being fetched: ', priceState.pairLoading);
      const pairId = `${baseId}${ilkId}`;
      const Cauldron = contractMap.get('Cauldron');
      const oracleName = ORACLE_INFO.get(fallbackChainId || 1)
        ?.get(baseId)
        ?.get(ilkId);
      const PriceOracle = contractMap.get(oracleName!);
      const base = assetRootMap.get(baseId);
      const ilk = assetRootMap.get(ilkId);

      diagnostics && console.log('Getting Asset Pair Info: ', bytesToBytes32(baseId, 6), bytesToBytes32(ilkId, 6));

      /* if all the parts are there update the pairInfo */

      if (Cauldron && PriceOracle && base && ilk) {
        updateState({ type: PriceState.START_PAIR_FETCH, payload: pairId });

        // /* Get debt params and spot ratios */
        const [{ max, min, sum, dec }, { ratio }] = await Promise.all([
          Cauldron.debt(baseId, ilkId),
          Cauldron.spotOracles(baseId, ilkId),
        ]);

        /* get pricing if available */
        let price: BigNumber;
        try {
          // eslint-disable-next-line prefer-const
          [price] = await PriceOracle.peek(
            bytesToBytes32(ilkId, 6),
            bytesToBytes32(baseId, 6),
            decimal18ToDecimalN(WAD_BN, ilk.decimals!)
          );
          diagnostics &&
            console.log(
              'Price fetched:',
              decimal18ToDecimalN(WAD_BN, ilk.decimals!).toString(),
              ilkId,
              'for',
              price.toString(),
              baseId
            );
        } catch (error) {
          diagnostics &&
            console.log('Error getting pricing for: ', bytesToBytes32(baseId, 6), bytesToBytes32(ilkId, 6), error);
          price = ethers.constants.Zero;
          // updateState( { type: 'END_PAIR_FETCH', payload: pairId })
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
          baseDecimals: base.decimals!,
          oracle: oracleName || '',
        };

        updateState({ type: PriceState.UPDATE_PAIR, payload: { pairId, pairInfo: newPair } });
        updateState({ type: PriceState.END_PAIR_FETCH, payload: pairId });
        return newPair;
      }
      return null;
    },
    [assetRootMap, contractMap, diagnostics, fallbackChainId, priceState.pairLoading]
  );

  const priceActions = { updateAssetPair };
  return <PriceContext.Provider value={{ priceState, priceActions }}>{children}</PriceContext.Provider>;
};

export { PriceContext };
export default PriceProvider;

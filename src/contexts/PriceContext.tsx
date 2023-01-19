import React, { useCallback, useContext, useReducer } from 'react';
import { BigNumber, ethers } from 'ethers';
import { bytesToBytes32, decimal18ToDecimalN } from '@yield-protocol/ui-math';
import { IAssetPair, IPriceContextState } from '../types';
import { ChainContext } from './ChainContext';

import { WAD_BN } from '../utils/constants';
import { SettingsContext } from './SettingsContext';
import { ORACLE_INFO } from '../config/oracles';
import useChainId from '../hooks/useChainId';
import { Cauldron } from '../contracts';
import useContracts, { ContractNames } from '../hooks/useContracts';

enum PriceState {
  UPDATE_PAIR = 'updatePair',
  START_FETCH = 'startPairFetch',
  END_FETCH = 'endPairFetch',
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
    case PriceState.START_FETCH:
      return {
        ...state,
        pairLoading: [...state.pairLoading, action.payload],
      };
    case PriceState.END_FETCH:
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
  const { chainState } = useContext(ChainContext);
  const { assetRootMap } = chainState;
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const chainId = useChainId();
  const contracts = useContracts();

  /* LOCAL STATE */
  const [priceState, updateState] = useReducer(priceReducer, initState);

  const updateAssetPair = useCallback(
    async (baseId: string, ilkId: string): Promise<IAssetPair | null> => {

      const pairId = `${baseId}${ilkId}`;
      const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron;
      const oracleName = ORACLE_INFO.get(chainId)?.get(baseId)?.get(ilkId);
      const PriceOracle = contracts.get(oracleName!);
      const base = assetRootMap.get(baseId);
      const ilk = assetRootMap.get(ilkId);

      /* if all the parts are there update the pairInfo */
      if (Cauldron && PriceOracle && base && ilk && !priceState.pairLoading.includes(pairId)) {

        console.log('Getting Asset Pair Info: ', bytesToBytes32(baseId, 6), bytesToBytes32(ilkId, 6));
        
        updateState({ type: PriceState.START_FETCH, payload: pairId });

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

        } catch (error) {
          diagnostics &&
            console.log('Error getting pricing for: ', bytesToBytes32(baseId, 6), bytesToBytes32(ilkId, 6), error);
          price = ethers.constants.Zero;
          // updateState( { type: 'END_FETCH', payload: pairId })
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
        updateState({ type: PriceState.END_FETCH, payload: pairId });
        return newPair;
      }
      return null;
    },
    [assetRootMap, chainId, contracts, diagnostics, priceState.pairLoading]
  );

  const priceActions = { updateAssetPair };
  return <PriceContext.Provider value={{ priceState, priceActions }}>{children}</PriceContext.Provider>;
};

export { PriceContext };
export default PriceProvider;

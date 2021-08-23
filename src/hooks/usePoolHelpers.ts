import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { ICallData, SignType, ISeries, ActionCodes, LadleActions, RoutedActions, IAsset } from '../types';
import { getTxCode } from '../utils/appUtils';
import { BLANK_VAULT, DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../utils/constants';
import { useChain } from './useChain';

import { calculateSlippage, fyTokenForMint, mint, mintWithBase, sellBase, splitLiquidity } from '../utils/yieldMath';
import { ChainContext } from '../contexts/ChainContext';
import SeriesSelector from '../components/selectors/SeriesSelector';

export const usePoolHelpers = (input: string | undefined) => {
  const poolMax = input;
  return { poolMax };
};

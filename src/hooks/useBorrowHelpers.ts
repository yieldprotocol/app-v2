import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, IVault, SignType, ISeries, ActionCodes, LadleActions } from '../types';
import { getTxCode } from '../utils/appUtils';
import { ETH_BASED_ASSETS, DAI_BASED_ASSETS, MAX_128, BLANK_VAULT } from '../utils/constants';
import { useChain } from './useChain';

import { calculateSlippage, secondsToFrom, sellBase } from '../utils/yieldMath';

export const useBorrowHelpers = () => {
  console.log('use borrow');
  const borrow='borrow'
  return { borrow }
};
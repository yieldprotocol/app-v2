import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { LidoWrapHandler } from '../../contracts';

import {
  ICallData,
  IVault,
  ISeries,
  ActionCodes,
  LadleActions,
  ISettingsContext,
  IUserContext,
  IAsset,
  RoutedActions,
} from '../../types';

import { cleanValue, getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT, ETH_BASED_ASSETS } from '../../utils/constants';
import { useChain } from '../useChain';

export const useWrapUnwrapAsset = () => {
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  // const {
  //   settingsState: { approveMax },
  // } = useContext(SettingsContext) as ISettingsContext;

  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: selectedIlkId } = userState;

  const { sign, transact } = useChain();

  const wrapAssetToJoin = async (
    value: BigNumber,
    asset: IAsset,
    wAssetHandlerAddress: string,
    txCode: string
  ) => {

    const ladleAddress = contractMap.get('Ladle').address;
    // const wrapHandler = contractMap.get('lidoWrapHandler');

    // const wrapHandlerMap = new Map([['stETH', '0x491aB93faa921C8E634F891F96512Be14fD3DbB1']]);
    // const wrapHandlerAddr = wrapHandlerMap.get('stETH');

    /* else return empty array */
    if (ETH_BASED_ASSETS.includes(selectedIlkId) && value.gte(ethers.constants.Zero)) {
      /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
      const permits: ICallData[] = await sign(
        [
          {
            target: asset,
            spender: ladleAddress,
            amount: value,
            ignoreIf: false,
          },
        ],
        txCode
      );

      // console.log('here');
      return [
        ...permits,
        {
          operation: LadleActions.Fn.TRANSFER,
          args: [asset.address, wAssetHandlerAddress, value] as LadleActions.Args.TRANSFER,
          ignoreIf: false,
        },
        {
          operation: LadleActions.Fn.ROUTE,
          args: [asset.joinAddress] as RoutedActions.Args.WRAP,
          fnName: RoutedActions.Fn.WRAP,
          targetContract: wAssetHandlerAddress,
          ignoreIf: false,
        },
      ];
    }
    /* else return empty array */
    return [];
  };

  const unwrapAssetToReceiver = async (value: BigNumber, wrappedAsset: IAsset, receiver: string) => {
    /* else return empty array */
    if (ETH_BASED_ASSETS.includes(selectedIlkId) && value.gte(ethers.constants.Zero)) {
      /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
      return [
        {
          operation: LadleActions.Fn.ROUTE,
          args: [receiver] as RoutedActions.Args.UNWRAP,
          fnName: RoutedActions.Fn.UNWRAP,
          targetContract: wrappedAsset,
          ignoreIf: false,
        },
      ];
    }
    /* else return empty array */
    return [];
  };

  return { wrapAssetToJoin, unwrapAssetToReceiver };
};

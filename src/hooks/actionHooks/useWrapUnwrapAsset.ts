import { BigNumber, ethers, Contract } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { LidoWrapHandler } from '../../contracts';

import {
  ICallData,
  LadleActions,
  IAsset,
  RoutedActions,
} from '../../types';

import { useChain } from '../useChain';

export const useWrapUnwrapAsset = () => {
  const {
    chainState: {
      connection: { account, provider },
      contractMap,
      assetRootMap,
    },
  } = useContext(ChainContext);
  const signer = account ? provider?.getSigner(account) : provider?.getSigner(0);

  const { sign } = useChain();

  const wrapHandlerAbi = ['function wrap(address to)', 'function unwrap(address to)'];

  const wrapAssetToJoin = async (value: BigNumber, asset: IAsset, txCode: string) : Promise<ICallData[]> => {
    const ladleAddress = contractMap.get('Ladle').address;
    
    if (asset.useWrappedVersion) {
      const wrappedAsset = assetRootMap.get(asset.symbol);
      const wraphandlerContract: Contract = new Contract(
        asset.wrapHandlerAddress,
        wrapHandlerAbi,
        signer
      );

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
          args: [asset.address, asset.wrapHandlerAddress, value] as LadleActions.Args.TRANSFER,
          ignoreIf: false,
        },
        {
          operation: LadleActions.Fn.ROUTE,
          args: [wrappedAsset.joinAddress] as RoutedActions.Args.WRAP,
          fnName: RoutedActions.Fn.WRAP,
          targetContract: wraphandlerContract,
          ignoreIf: false,
        },
      ];
    }
    /* else return empty array */
    return [];
  };

  const unwrapAsset = async (
    asset: IAsset,
    receiver: string
  ) : Promise<ICallData[]> => {

    const wraphandlerContract: Contract = new Contract(
      asset.wrapHandlerAddress,
      wrapHandlerAbi,
      signer
    );

    if (asset.useWrappedVersion) {
      /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
      return [
        {
          operation: LadleActions.Fn.ROUTE,
          args: [receiver] as RoutedActions.Args.UNWRAP,
          fnName: RoutedActions.Fn.UNWRAP,
          targetContract: wraphandlerContract,
          ignoreIf: false,
        },
      ];
    }
    /* else return empty array */
    return [];
  };

  return { wrapAssetToJoin, unwrapAsset };
};

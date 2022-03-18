import { BigNumber, Contract } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { ICallData, LadleActions, IAsset, RoutedActions } from '../../types';
import { MAX_256, ZERO_BN } from '../../utils/constants';
import { useChain } from '../useChain';

export const useWrapUnwrapAsset = () => {
  const {
    chainState: {
      connection: { account, provider },
      contractMap,
      assetRootMap,
    },
  } = useContext(ChainContext);

  const {
    settingsState: { unwrapTokens, diagnostics },
  } = useContext(SettingsContext);

  const signer = account ? provider?.getSigner(account) : provider?.getSigner(0);
  const { sign } = useChain();

  const wrapHandlerAbi = ['function wrap(address to)', 'function unwrap(address to)'];

  const wrapAssetToJoin = async (value: BigNumber, asset: IAsset, txCode: string): Promise<ICallData[]> => {
    const ladleAddress = contractMap.get('Ladle').address;

    if (!asset.isWrappedToken && asset.wrappedTokenId && asset.wrapHandlerAddress && value.gt(ZERO_BN)) {
      const wraphandlerContract: Contract = new Contract(asset.wrapHandlerAddress, wrapHandlerAbi, signer);
      const unwrappedAssetContract = assetRootMap.get(asset.id);
      diagnostics && console.log('Asset Contract to be signed for wrapping: ', unwrappedAssetContract);

      /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
      const permit: ICallData[] = await sign(
        [
          {
            target: unwrappedAssetContract, // full target contract
            spender: ladleAddress,
            amount: value,
            ignoreIf: false,
          },
        ],
        txCode
      );

      return [
        ...permit,
        {
          operation: LadleActions.Fn.TRANSFER,
          args: [asset.address, asset.wrapHandlerAddress, value] as LadleActions.Args.TRANSFER,
          ignoreIf: false,
        },
        {
          operation: LadleActions.Fn.ROUTE,
          args: [asset.joinAddress] as RoutedActions.Args.WRAP,
          fnName: RoutedActions.Fn.WRAP,
          targetContract: wraphandlerContract,
          ignoreIf: false,
        },
      ];
    }
    /* else  if not a wrapped asset simply return empty array */
    return [];
  };

  const unwrapAsset = async (asset: IAsset, receiver: string): Promise<ICallData[]> => {
    if (unwrapTokens && asset.wrapHandlerAddress) {
      diagnostics && console.log('Unwrapping tokens before return');
      const wraphandlerContract: Contract = new Contract(asset.wrapHandlerAddress, wrapHandlerAbi, signer);

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
    diagnostics && console.log('NOT unwrapping tokens before return');
    return [];
  };

  return { wrapAssetToJoin, unwrapAsset };
};

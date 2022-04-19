import { BigNumber, Contract } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { ICallData, LadleActions, IAsset, RoutedActions } from '../../types';
import { ZERO_BN } from '../../utils/constants';
import { useChain } from '../useChain';

export const useWrapUnwrapAsset = () => {
  const {
    chainState: {
      connection: { account, provider, chainId },
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

  const wrapAsset = async (
    value: BigNumber,
    asset: IAsset,
    txCode: string,
    to?: string | undefined // optional send destination : DEFAULT is assetJoin address
  ): Promise<ICallData[]> => {
    const ladleAddress = contractMap.get('Ladle').address;
    const toAddress = to || asset.joinAddress
    const wrapHandlerAddress = asset.wrapHandlerAddresses?.get(chainId)

    if (wrapHandlerAddress && value.gt(ZERO_BN)) {

      const wrapHandlerContract: Contract = new Contract(wrapHandlerAddress, wrapHandlerAbi, signer);
      const assetContract = assetRootMap.get(asset.id);
      diagnostics && console.log('Asset Contract to be signed for wrapping: ', assetContract);

      /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
      const permitCallData: ICallData[] = await sign(
        [
          {
            target: assetContract, // full target contract
            spender: ladleAddress,
            amount: value,
            ignoreIf: false,
          },
        ],
        txCode
      );

      return [
        ...permitCallData,
        {
          operation: LadleActions.Fn.TRANSFER,
          args: [asset.address, wrapHandlerAddress, value] as LadleActions.Args.TRANSFER,
          ignoreIf: false,
        },
        {
          operation: LadleActions.Fn.ROUTE,
          args: [toAddress] as RoutedActions.Args.WRAP,
          fnName: RoutedActions.Fn.WRAP,
          targetContract: wrapHandlerContract,
          ignoreIf: false,
        },
      ];
    }
    /* else if not a wrapped asset, (or value is 0) simply return empty array */
    return [];
  };

  const unwrapAsset = async (asset: IAsset, receiver: string): Promise<ICallData[]> => {

    const unwrapHandlerAddress = asset.unwrapHandlerAddresses?.get(chainId)

    if (unwrapTokens && unwrapHandlerAddress) {
      diagnostics && console.log('Unwrapping tokens before return');
      const wraphandlerContract: Contract = new Contract(unwrapHandlerAddress, wrapHandlerAbi, signer);

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

  return { wrapAsset, unwrapAsset };
};

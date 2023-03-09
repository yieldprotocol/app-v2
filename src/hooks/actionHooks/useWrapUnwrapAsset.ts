import { BigNumber, Contract } from 'ethers';
import { useContext } from 'react';
import { useNetwork, useSigner } from 'wagmi';
import { ChainContext } from '../../contexts/ChainContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { ContractNames } from '../../config/yieldEnv';
import { ICallData, LadleActions, IAsset, RoutedActions, IAssetRoot } from '../../types';
import { ZERO_BN } from '../../utils/constants';
import { useChain } from '../useChain';
import useContracts from '../useContracts';

export const useWrapUnwrapAsset = () => {
  const {
    chainState: { assetRootMap },
  } = useContext(ChainContext);

  const {
    settingsState: { unwrapTokens, diagnostics },
  } = useContext(SettingsContext);

  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const { sign } = useChain();
  const contracts = useContracts();

  const wrapHandlerAbi = ['function wrap(address to)', 'function unwrap(address to)'];

  const wrapAsset = async (
    value: BigNumber,
    asset: IAsset,
    txCode: string,
    to?: string | undefined // optional send destination : DEFAULT is assetJoin address
  ): Promise<ICallData[]> => {
    if (!contracts) throw new Error('Contracts not found');

    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;
    /* SET the destination address DEFAULTs to the assetJoin Address */
    const toAddress = to || asset.joinAddress;
    const wrapHandlerAddress =
      chain && asset.wrapHandlerAddresses?.has(chain.id) ? asset.wrapHandlerAddresses.get(chain.id) : undefined;

    /* NB! IF a wraphandler exists, we assume that it is Yield uses the wrapped version of the token */
    if (wrapHandlerAddress && value.gt(ZERO_BN)) {
      const wrapHandlerContract: Contract = new Contract(wrapHandlerAddress, wrapHandlerAbi, signer!);
      const { assetContract } = assetRootMap.get(asset.id) as IAssetRoot; // note -> this is NOT the proxyID

      diagnostics && console.log('Asset Contract to be signed for wrapping: ', assetContract.id);

      /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
      const permitCallData: ICallData[] = await sign(
        [
          {
            target: asset, // full target contract
            spender: ladleAddress!,
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
    const unwrapHandlerAddress =
      chain && asset.unwrapHandlerAddresses?.has(chain.id) ? asset.unwrapHandlerAddresses.get(chain.id) : undefined;

    /* if there is an unwrap handler we assume the token needs to be unwrapped  ( unless the 'unwrapTokens' setting is false) */
    if (unwrapTokens && unwrapHandlerAddress) {
      diagnostics && console.log('Unwrapping tokens before return');
      const unwraphandlerContract: Contract = new Contract(unwrapHandlerAddress, wrapHandlerAbi, signer!);

      return [
        {
          operation: LadleActions.Fn.ROUTE,
          args: [receiver] as RoutedActions.Args.UNWRAP,
          fnName: RoutedActions.Fn.UNWRAP,
          targetContract: unwraphandlerContract,
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

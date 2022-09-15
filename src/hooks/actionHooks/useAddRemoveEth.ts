import { BigNumber } from 'ethers';
import { useContext } from 'react';
import { useAccount } from 'wagmi';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, LadleActions, IUserContext, IUserContextState, IUserContextActions } from '../../types';
import { ModuleActions } from '../../types/operations';
import { ZERO_BN } from '../../utils/constants';

export const useAddRemoveEth = () => {
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  const { address: account } = useAccount();
  const WrapEtherModuleContract = contractMap.get('WrapEtherModule');

  const addEth = (
    value: BigNumber,
    to: string | undefined = undefined,
    alternateEthAssetId: string | undefined = undefined
  ): ICallData[] =>
    /* if there is a destination 'to' then use the ladle module (wrapEtherModule) */
    to
      ? [
          {
            operation: LadleActions.Fn.MODULE,
            fnName: ModuleActions.Fn.WRAP_ETHER_MODULE,
            args: [to || account, value] as ModuleActions.Args.WRAP_ETHER_MODULE,
            targetContract: WrapEtherModuleContract,
            ignoreIf: value.lte(ZERO_BN), // ignores if value is 0 or negative
            overrides: { value },
          },
        ]
      : /* else use simple JOIN_ETHER  with optional */
        [
          {
            operation: LadleActions.Fn.JOIN_ETHER,
            args: [alternateEthAssetId || '0x303000000000'] as LadleActions.Args.JOIN_ETHER, // use alt eth ID if reqd. defaults to WETH
            ignoreIf: value.lte(ZERO_BN), // ignores if value is zero OR NEGATIVE
            overrides: { value },
          },
        ];

  // NOTE: EXIT_ETHER sweeps all out of the ladle, so *value* is not important > it must just be bigger than zero to not be ignored
  const removeEth = (value: BigNumber, to: string | undefined = undefined): ICallData[] => [
    {
      operation: LadleActions.Fn.EXIT_ETHER,
      args: [to || account] as LadleActions.Args.EXIT_ETHER,
      ignoreIf: value.eq(ZERO_BN), // ignores if value is ZERO. NB NOTE: sign (+-) is irrelevant here
    },
  ];

  return { addEth, removeEth };
};

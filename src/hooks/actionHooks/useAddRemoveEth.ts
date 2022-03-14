import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';

import { ICallData, LadleActions, IUserContext, IUserContextState, IUserContextActions} from '../../types';

export const useAddRemoveEth = () => {
  const { userState }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;

  const { activeAccount: account } = userState;

  const addEth = (value: BigNumber, ignoreIf: boolean, alternateEthAssetId?: string|undefined ): ICallData[] =>
    !ignoreIf
      ? [
          {
            operation: LadleActions.Fn.JOIN_ETHER,
            args: [alternateEthAssetId || '0x303000000000'] as LadleActions.Args.JOIN_ETHER,
            ignoreIf: value.lte(ethers.constants.Zero),
            overrides: { value },
          },
        ]
      : [];

  const removeEth = (value: BigNumber, ignoreIf: boolean, ): ICallData[] =>
    !ignoreIf
      ? [
          {
            operation: LadleActions.Fn.EXIT_ETHER,
            args: [account] as LadleActions.Args.EXIT_ETHER,
            ignoreIf: value.gte(ethers.constants.Zero),
          },
        ]
      : [];

  return { addEth, removeEth };
};

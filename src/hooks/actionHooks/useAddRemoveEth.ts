import { BigNumber } from 'ethers';
import { ContractNames } from '../../config/contracts';
import { ICallData, LadleActions } from '../../types';
import { ModuleActions } from '../../types/operations';
import { ZERO_BN } from '../../utils/constants';
import useAccountPlus from '../useAccountPlus';
import useContracts from '../useContracts';
import { UserContext } from '../../contexts/UserContext';
import { useContext } from 'react';

export const useAddRemoveEth = () => {
  const { userState } = useContext(UserContext);
  const { selectedVR } = userState;

  const { address: account } = useAccountPlus();
  const contracts = useContracts();
  const WrapEtherModuleContract = contracts?.get(ContractNames.WRAP_ETHER_MODULE);

  const addEth = (
    value: BigNumber,
    to: string | undefined = undefined,
    alternateEthAssetId: string | undefined = undefined
  ): ICallData[] => {
    if (!WrapEtherModuleContract) throw new Error('WrapEtherModuleContract not found');

    /* if there is a destination 'to' then use the ladle module (wrapEtherModule) */
    return to
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
  };

  // NOTE: EXIT_ETHER sweeps all out of the ladle, so *value* is not important > it must just be bigger than zero to not be ignored
  const removeEth = (value: BigNumber, to: string | undefined = undefined): ICallData[] => [
    {
      operation: selectedVR ? LadleActions.Fn.UNWRAP_ETHER : LadleActions.Fn.EXIT_ETHER,
      args: [to || account] as LadleActions.Args.EXIT_ETHER,
      ignoreIf: value.eq(ZERO_BN), // ignores if value is ZERO. NB NOTE: sign (+-) is irrelevant here
    },
  ];

  return { addEth, removeEth };
};

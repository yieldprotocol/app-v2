import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, IVault, ISeries, ActionCodes, LadleActions } from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT, ETH_BASED_ASSETS } from '../../utils/constants';
import { useChain } from '../useChain';

export const useAddCollateral = () => {
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);
  
  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, selectedBaseId, selectedIlkId, selectedSeriesId, seriesMap, assetMap } = userState;
  const { updateAssets, updateVaults } = userActions;

  const { sign, transact } = useChain();

  const addEth = (value: BigNumber, series: ISeries): ICallData[] => {
    const isPositive = value.gte(ethers.constants.Zero);
    /* Check if the selected Ilk is, in fact, an ETH variety */
    if (ETH_BASED_ASSETS.includes(selectedIlkId) && isPositive) {
      /* return the add ETH OP */
      return [
        {
          operation: LadleActions.Fn.JOIN_ETHER,
          args: [selectedIlkId] as LadleActions.Args.JOIN_ETHER,
          ignoreIf: false,
          overrides: { value },
        },
      ];
    }
    /* else return empty array */
    return [];
  };

  const addCollateral = async (vault: IVault | undefined, input: string) => {

    /* use the vault id provided OR 0 if new/ not provided */
    const vaultId = vault?.id || BLANK_VAULT;

    /* set the series and ilk based on if a vault has been selected or it's a new vault */
    const series = vault ? seriesMap.get(vault.seriesId) : seriesMap.get(selectedSeriesId);
    const ilk = vault ? assetMap.get(vault.ilkId) : assetMap.get(selectedIlkId);
    const base = vault ? assetMap.get(vault.baseId) : assetMap.get(selectedBaseId);

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ADD_COLLATERAL, vaultId);

    /* parse inputs to BigNumber in Wei */
    const cleanedInput = cleanValue(input, ilk.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, ilk.decimals);

    /* check if the ilk/asset is an eth asset variety, if so pour to Ladle */
    const _isEthBased = ETH_BASED_ASSETS.includes(ilk.id);
    const _pourTo = _isEthBased ? contractMap.get('Ladle').address : account;


    console.log( _input.eq(ethers.constants.Zero));

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permits: ICallData[] = await sign(
      [
        {
          target: ilk,
          spender: ilk.joinAddress,
          ignoreIf: _isEthBased,
          amount: _input,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      /* If vault is null, build a new vault, else ignore */
      {
        operation: LadleActions.Fn.BUILD,
        args: [selectedSeriesId, selectedIlkId, '0'] as LadleActions.Args.BUILD,
        ignoreIf: !!vault,
      },
      // ladle.joinEtherAction(ethId),
      ...addEth(_input, series),
      // ladle.forwardPermitAction(ilkId, true, ilkJoin.address, posted, deadline, v, r, s)
      ...permits,
      // ladle.pourAction(vaultId, ignored, posted, 0)
      {
        operation: LadleActions.Fn.POUR,
        args: [
          vaultId,
          _pourTo /* pour destination based on ilk/asset is an eth asset variety */,
          _input,
          ethers.constants.Zero,
        ] as LadleActions.Args.POUR,
        ignoreIf: false,
      },
    ];

    await transact(calls, txCode);
    updateVaults([vault]);
    updateAssets([base, ilk]);
  };

  return { addEth, addCollateral };
};

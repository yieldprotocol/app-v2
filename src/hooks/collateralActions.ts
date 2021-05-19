import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, IVault, SignType, ISeries } from '../types';
import { getTxCode } from '../utils/appUtils';
import { ETH_BASED_ASSETS } from '../utils/constants';
import { useChain } from './chainHooks';

import { VAULT_OPS } from '../utils/operations';

/* Generic hook for chain transactions */
export const useCollateralActions = () => {
  const { chainState: { account, contractMap } } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlkId, selectedSeriesId, seriesMap, assetMap } = userState;
  const { updateVaults, updateSeries } = userActions;

  const { sign, transact } = useChain();

  const _addEth = (value: BigNumber, series:ISeries): ICallData[] => {
    const isPositive = value.gte(ethers.constants.Zero);
    /* Check if the selected Ilk is, in fact, an ETH variety */
    if (ETH_BASED_ASSETS.includes(selectedIlkId) && isPositive) {
      /* return the add ETH OP */
      return [{
        operation: VAULT_OPS.JOIN_ETHER,
        args: [selectedIlkId],
        ignore: false,
        overrides: { value },
        series,
      }];
    }
    /* else return empty array */
    return [];
  };

  const _removeEth = (value: BigNumber, series:ISeries): ICallData[] => {
    /* First check if the selected Ilk is, in fact, an ETH variety */
    if (ETH_BASED_ASSETS.includes(selectedIlkId)) {
      /* return the remove ETH OP */
      return [{
        operation: VAULT_OPS.EXIT_ETHER,
        args: [selectedIlkId, account],
        ignore: value.gte(ethers.constants.Zero),
        series,
      }];
    }
    /* else return empty array */
    return [];
  };

  const addCollateral = async (
    vault: IVault|undefined,
    input: string,
  ) => {
    /* use the vault id provided OR Get a random vault number ready if reqd. */
    const vaultId = vault?.id || ethers.utils.hexlify(ethers.utils.randomBytes(12));
    /* set the series and ilk based on if a vault has been selected or it's a new vault */
    const series = vault ? seriesMap.get(vault.seriesId) : seriesMap.get(selectedSeriesId);
    const ilk = vault ? assetMap.get(vault.ilkId) : assetMap.get(selectedIlkId);
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('000_', vaultId);

    /* parse inputs to BigNumber in Wei */
    const _input = ethers.utils.parseEther(input);

    /* check if the ilk/asset is an eth asset variety, if so pour to Ladle */
    const _isEthBased = ETH_BASED_ASSETS.includes(ilk.id);
    const _pourTo = ETH_BASED_ASSETS.includes(ilk.id) ? contractMap.get('Ladle').address : account;

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permits: ICallData[] = await sign([
      {
        target: ilk,
        type: SignType.ERC2612,
        spender: ilk.joinAddress,
        series,
        fallbackCall: { fn: 'approve', args: [], ignore: false, opCode: null },
        ignore: _isEthBased,
      },
    ], txCode);

    const calls: ICallData[] = [
      /* If vault is null, build a new vault, else ignore */
      {
        operation: VAULT_OPS.BUILD,
        args: [vaultId, selectedSeriesId, selectedIlkId],
        series,
        ignore: !!vault,
      },
      // ladle.joinEtherAction(ethId),
      ..._addEth(_input, series),
      // ladle.forwardPermitAction(ilkId, true, ilkJoin.address, posted, deadline, v, r, s)
      ...permits,
      // ladle.pourAction(vaultId, ignored, posted, 0)
      {
        operation: VAULT_OPS.POUR,
        args: [
          vaultId,
          _pourTo, /* pour destination based on ilk/asset is an eth asset variety */
          _input,
          ethers.constants.Zero,
        ],
        series,
        ignore: false,
      },
    ];

    await transact('Ladle', calls, txCode);
    updateVaults([vault]);
  };

  const removeCollateral = async (
    vault: IVault,
    input: string,
  ) => {
    /* generate the txCode for tx tracking and tracing */
    const txCode = getTxCode('010_', vault.id);

    /* get associated series and ilk */
    const series = seriesMap.get(vault.seriesId);
    const ilk = assetMap.get(vault.ilkId);

    /* parse inputs to BigNumber in Wei, and NEGATE */
    const _input = ethers.utils.parseEther(input).mul(-1);

    /* check if the ilk/asset is an eth asset variety, if so pour to Ladle */
    const _pourTo = ETH_BASED_ASSETS.includes(ilk.id) ? contractMap.get('Ladle').address : account;

    const calls: ICallData[] = [
      // ladle.pourAction(vaultId, ignored, -posted, 0)
      {
        operation: VAULT_OPS.POUR,
        args: [
          vault.id,
          _pourTo, /* pour destination based on ilk/asset is an eth asset variety */
          _input,
          ethers.constants.Zero,
        ],
        series,
        ignore: false,
      },
      ..._removeEth(_input, series),
    ];

    await transact('Ladle', calls, txCode);
    updateVaults([vault]);
  };

  return {
    addCollateral,
    removeCollateral,
  };
};

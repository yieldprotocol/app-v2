import { BigNumber, Contract, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { Ladle } from '../contracts/Ladle';
import { ICallData, IYieldSeries, IYieldVault, SignType } from '../types';
import { getTxCode } from '../utils/appUtils';
import { MAX_128 } from '../utils/constants';
import { useChain } from './chainHooks';

/* Generic hook for chain transactions */
export const useActions = () => {
  const { chainState: { account, contractMap } } = useContext(ChainContext);
  const { userState: { selectedBase, selectedIlk, selectedSeries } } = useContext(UserContext);

  const ladle = contractMap.get('Ladle') as Ladle;
  const { sign, transact } = useChain();

  /**
   * Common ICalldata builders:
   *  - Create a call that builds a new Vault
   *  - Create a call that takes ETH, wraps it, and adds it as collateral
   * */
  const _buildVault = (vault:string, ignore:boolean): ICallData[] => [{ fn: 'build', args: [vault, selectedSeries.id, selectedIlk.id], ignore }];
  const _depositEth = (value: BigNumber): ICallData[] => (
    /* First check if the selected Ilk is an ETH variety :  */
    ['0x455448000000', 'ETH_B_forexample'].includes(selectedIlk.id)
      ? [{ fn: 'joinEther', args: [selectedIlk.id], ignore: false, overrides: { value } }]
      : []
  );

  const borrow = async (
    input:string|undefined,
    collInput:string|undefined,
    vault: IYieldVault|null = null,
    // autoSell: boolean = true,
  ) => {
    /* use the vault id provided OR Get a random vault number ready if reqd. */
    const _vault = vault?.id || ethers.utils.hexlify(ethers.utils.randomBytes(12));
    const _series = vault ? vault.series : selectedSeries;
    const _base = vault ? vault.base : selectedBase;

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('010_', _vault);

    /* parse inputs */
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = collInput ? ethers.utils.parseEther(collInput) : ethers.constants.Zero;

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permits: ICallData[] = await sign([
      {
        assetOrSeriesId: selectedIlk.id,
        type: SignType.ERC2612,
        fallbackCall: { fn: 'approve', args: [], ignore: false },
        ignore: selectedIlk.id === '0x455448000000',
      },
      /* BELOW are EXAMPLES for future */
      {
        assetOrSeriesId: _base.id,
        type: SignType.DAI,
        fallbackCall: { fn: 'approve', args: [], ignore: false },
        ignore: true,
      },
      {
        assetOrSeriesId: _series.id,
        type: SignType.FYTOKEN,
        fallbackCall: { fn: 'approve', args: [], ignore: false },
        ignore: true,
      },
    ], txCode); // assign the processCode to the signings

    /* Collate all the calls required for the process (including depositing ETH, signing permits, and building vault if needed) */
    const calls: ICallData[] = [
      /* handle ETH deposit, if required */
      ..._depositEth(_collInput),
      /* Include all the signatures gathered, if required  */
      ...permits,
      /* If vault is null, build a new vault, else ignore */
      ..._buildVault(_vault, !!vault),
      /* Then add all the ladle CALLS you want to make: */
      {
        fn: 'pour',
        args: [_vault, account, _collInput, _input],
        ignore: false,
      },
      {
        fn: 'serve',
        args: [_vault, account, ethers.constants.Zero, _input, MAX_128],
        ignore: false,
      },
    ];
    /* handle the transaction */
    transact(ladle, calls, txCode);
  };

  const repay = async (
    input:string|undefined,
    vault: IYieldVault,
  ) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('020_', vault.series.id);
    /* Parse/clean inputs */
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;

    /* Gather all the required signatures - sign() processes them and returns them as ICallData */
    const permits: ICallData[] = await sign([
      {
        assetOrSeriesId: vault.series.id,
        type: SignType.FYTOKEN,
        fallbackCall: { fn: 'approve', args: [], ignore: false },
        message: 'Signing fytoken approval',
        ignore: false,
      },
    ], txCode);

    /* Collate all the calls required for the process (including depositing ETH, signing permits, and building vault if needed) */
    const calls: ICallData[] = [
      /* Include all the signatures gathered, if required  */
      ...permits,
      /* Then add all the ladle CALLS you want to make: */
      /* requires a token transfer to the pool from ladle */

      /* ladle.repay(vaultId, owner, inkRetrieved, 0) */
      { fn: 'repay',
        args: [vault.id, account, BigNumber.from('1'), ethers.constants.Zero],
        ignore: false,
      },
      /* ladle.repayVault(vaultId, owner, inkRetrieved, MAX) */
      { fn: 'repayVault',
        args: [vault.id, account, BigNumber.from('1'), MAX_128],
        ignore: true,
      },

    ];
    transact(ladle, calls, txCode);
  };

  const buySell = async () => {
    /* generate the reproducible txCode for tx tracking and tracing */
    // const txCode = getTxCode('020_', vault.series.id);
  };

  const addRemoveLiquidity = async () => {
    /* generate the reproducible txCode for tx tracking and tracing */
    // const txCode = getTxCode('020_', vault.series.id);
  };

  return { borrow, repay, buySell, addRemoveLiquidity };
};

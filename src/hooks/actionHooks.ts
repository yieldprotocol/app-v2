import { BigNumber, Contract, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { Ladle } from '../contracts/Ladle';
import { IYieldSeries, IYieldVault } from '../types';
import { getTxCode } from '../utils/appUtils';
import { MAX_128 } from '../utils/constants';
import { useChain, ICallData, SignType } from './chainHooks';

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
  const _buildVault = (vault:string, ignore:boolean): ICallData[] => {
    console.log('Building vault', vault, ignore, selectedSeries.id, selectedIlk.id); // TODO remove console Log
    return [{ fn: 'build', args: [vault, selectedSeries.id, selectedIlk.id], ignore }];
  };

  const _depositEth = (value: BigNumber): ICallData[] => {
    console.log('Depositing ETH: ', selectedIlk.id, value); // TODO remove console Log
    /* First check if the selected Ilk is an ETH variety :  */
    return ['0x455448000000', 'ETH_B_forexample'].includes(selectedIlk.id)
      ? [{ fn: 'joinEther', args: [selectedIlk.id], ignore: false, overrides: { value } }]
      : [];
  };

  const borrow = async (
    input:string|undefined,
    collInput:string|undefined,
    vault: IYieldVault|null = null,
    // autoSell: boolean = true,
  ) => {
    /* Get a random vault number ready if reqd. */
    const randVault = ethers.utils.hexlify(ethers.utils.randomBytes(12));
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('BORROW', vault?.id || randVault);

    /* parse/clean inputs */
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = collInput ? ethers.utils.parseEther(collInput) : ethers.constants.Zero;

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const sigs: ICallData[] = await sign(
      [
        {
          assetOrSeriesId: selectedIlk.id,
          type: SignType.ERC2612,
          fallbackCall: { fn: 'approve', args: [], ignore: false },
          ignore: selectedIlk.id === '0x455448000000',
        },
        /* BELOW are EXAMPLES for future */
        {
          assetOrSeriesId: selectedBase.id,
          type: SignType.DAI,
          fallbackCall: { fn: 'approve', args: [], ignore: false },
          ignore: true,
        },
        {
          assetOrSeriesId: selectedSeries.id,
          type: SignType.FYTOKEN,
          fallbackCall: { fn: 'approve', args: [], ignore: false },
          ignore: true,
        },
      ],
      txCode,
    );

    /* Collate all the calls required for the process (including depositing ETH, signing permits, and building vault if needed) */
    const calls: ICallData[] = [
      /* handle ETH,  if required */
      ..._depositEth(_collInput),
      /* Include all the signatures gathered, if required  */
      ...sigs,
      /* If vault is null, build a new vault, else ignore ( // TODO easy to add building more than one vault) */
      ..._buildVault(randVault, !!vault),
      /* Then add all the CALLS you want to make: */
      {
        fn: 'pour',
        args: [(vault?.id || randVault), account, _collInput, ethers.constants.Zero],
        ignore: false,
      },
      {
        fn: 'serve',
        args: [(vault?.id || randVault), account, ethers.constants.Zero, _input, MAX_128],
        ignore: false,
      },
    ];
    transact(ladle, calls, txCode);
  };

  const repay = async (
    input:string|undefined,
    vault: IYieldVault,
  ) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('REPAY', vault.series.id);
    /* Parse/clean inputs */
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;

    /* Gather all the required signatures - sign() processes them and returns them as ICallData */
    const sigs: ICallData[] = await sign(
      [
        {
          assetOrSeriesId: vault.series.id,
          type: SignType.FYTOKEN,
          fallbackCall: { fn: 'approve', args: [], ignore: false },
          ignore: false,
        },
      ],
      txCode,
    );

    /* Collate all the calls required for the process (including depositing ETH, signing permits, and building vault if needed) */
    const calls: ICallData[] = [
      /* Include all the signatures gathered, if required  */
      ...sigs,
      /* Then add all the CALLS you want to make: */
      {
        fn: 'pour',
        args: [vault.id, account, ethers.constants.Zero, _input.mul(BigNumber.from('-1'))],
        ignore: false,
      },
      /* immediatly release collateral, if required pour to weth, then exit */
      { fn: 'pour',
        args: [vault.id, ladle.address, _input.div(BigNumber.from('-2')), ethers.constants.Zero],
        ignore: true,
      },
      { fn: 'exitEther',
        args: [account],
        ignore: true,
      },

    ];
    transact(ladle, calls, txCode);
  };

  return { borrow, repay };
};

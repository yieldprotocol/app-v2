import { BigNumber, Contract, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { Ladle } from '../contracts/Ladle';
import { getTxCode } from '../utils/appUtils';
import { useChain, ICallData, SignType } from './chainHooks';

/* Generic hook for chain transactions */
export const useActions = () => {
  const { chainState: { account, contractMap } } = useContext(ChainContext);
  const { userState: { selectedIlk, selectedSeries } } = useContext(UserContext);

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
    console.log('_depositETH: ', selectedIlk.id, value); // TODO remove console Log
    /* First check if the selected Ilk is an ETH variety :  */
    return ['0x455448000000', 'ETH_B_forexample.HEx'].includes(selectedIlk.id)
      ? [{ fn: 'joinEther', args: [selectedIlk.id], ignore: false, overrides: { value } }]
      : [];
  };

  const borrow = async (
    input:string|undefined,
    collInput:string|undefined,
    vault: string| null = null,
  ) => {
    /* Get a random vault number ready if reqd. */
    const randVault = ethers.utils.hexlify(ethers.utils.randomBytes(12));
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('BORROW', vault || randVault);

    /* parse/clean inputs */
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = collInput ? ethers.utils.parseEther(collInput) : ethers.constants.Zero;

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const sigs: ICallData[] = await sign(
      [
        {
          tokenId: selectedIlk.id,
          type: SignType.ERC2612,
          fallbackCall: { fn: 'approve', args: [], ignore: false },
          ignore: selectedIlk.id === '0x455448000000',
        },
        {
          tokenId: '0xb17e4aebd805',
          fallbackCall: { fn: 'approve', args: [], ignore: false },
          ignore: true,
          type: SignType.DAI,
        },
        {
          tokenId: '0xb17e4aebd805',
          fallbackCall: { fn: 'approve', args: [], ignore: false },
          ignore: true,
          type: SignType.FYTOKEN,
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
        args: [vault || randVault, account, _collInput, _input],
        ignore: false,
      },
    ];
    transact(ladle, calls, txCode);
  };

  return { borrow };
};

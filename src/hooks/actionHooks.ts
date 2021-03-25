import { BigNumber, Contract, ethers } from 'ethers';
import { useContext } from 'react';
import { toast } from 'react-toastify';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
import { Ladle } from '../contracts/Ladle';
import { IYieldVault } from '../types';
import { useChain } from './chainHooks';

interface callData {
  fnName: string;
  args: any[];
}

/* Generic hook for chain transactions */
export const useActions = () => {
  const { chainState: { account, chainId, contractMap, seriesMap, assetMap }, chainActions } = useContext(ChainContext);
  const { userState: { selectedIlk, selectedSeries, selectedBase }, userActions } = useContext(UserContext);

  const { txState, txActions } = useContext(TxContext);
  const { handleTx, handleTxRejection } = txActions;

  const { userState } = useContext(UserContext);

  const ladle = contractMap.get('Ladle') as Ladle;
  const { transact, multiCall } = useChain();

  const buildVaultObject = (vaultId:string) => ({ fnName: 'build', args: [vaultId, selectedSeries.id, selectedIlk.id] });

  const borrow = async (
    input:string|undefined,
    collInput:string|undefined,
    vault: string| null = null,
  ) => {
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = collInput ? ethers.utils.parseEther(collInput) : ethers.constants.Zero;

    /* check auth requirements */
    const sigRequired = 'as;';

    const randVault = ethers.utils.hexlify(ethers.utils.randomBytes(12));
    vault && transact(ladle, 'pour', [vault, account, _input, _collInput]);
    !vault && console.log(randVault, selectedSeries.id, selectedIlk.id);
    !vault && multiCall(
      ladle,
      [
        { fnName: 'build', args: [randVault, selectedSeries.id, selectedIlk.id] },
        { fnName: 'pour', args: [randVault, account, _input, _collInput] },
      ],
    );
  };

  const checkVault = async (
    id:string|null = null,
  ) => {
    const _id = id ? ethers.utils.hexlify(id) : userState?.activeVault?.id || 'nothing';
    console.log(_id);
  };

  return { borrow, checkVault };
};

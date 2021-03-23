import { BigNumber, Contract, ethers } from 'ethers';
import { useContext } from 'react';
import { toast } from 'react-toastify';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
import { Ladle } from '../contracts/Ladle';
import { useChain } from './chainHooks';

interface callData {
  fnName: string;
  args: any[];
}

/* Generic hook for chain transactions */
export const useActions = () => {
  const { chainState, chainActions } = useContext(ChainContext);
  const { account, chainId, contractMap, seriesMap, assetMap, activeAsset, activeSeries } = chainState;

  const { txState, txActions } = useContext(TxContext);
  const { handleTx, handleTxRejection } = txActions;

  const { userState } = useContext(UserContext);

  const ladle = contractMap.get('Ladle') as Ladle;
  const { transact, multiCall } = useChain();

  const borrow = async (
    input:string|undefined,
    collInput:string|undefined,
    vault: string| null = null,
  ) => {
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = collInput ? ethers.utils.parseEther(collInput) : ethers.constants.Zero;

    console.log(userState, vault);

    const _newVault = '0x78f617882cb7f4f617345367'; // vault name gnerator
    vault && transact(ladle, 'pour', [userState.activeVault.id, account, _input, _collInput]);
    !vault && multiCall(
      ladle,
      [
        { fnName: 'build', args: [_newVault, activeSeries.seriesId, activeAsset.id] },
        { fnName: 'pour', args: ['0xf4f617882cb7f4f617882c45', account, _input, _collInput] },
      ],
    );
  };

  return { borrow };
};

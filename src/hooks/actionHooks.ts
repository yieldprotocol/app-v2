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
  const { chainState, chainActions } = useContext(ChainContext);
  const { account, chainId, contractMap, seriesMap, assetMap, activeAsset, activeSeries } = chainState;

  const { txState, txActions } = useContext(TxContext);
  const { handleTx, handleTxRejection } = txActions;

  const { userState } = useContext(UserContext);

  const ladle = contractMap.get('Ladle') as Ladle;
  const { transact, multiCall } = useChain();

  const buildVaultObject = (vaultId:string) => ({ fnName: 'build', args: [vaultId, activeSeries.seriesId, activeAsset.id] });

  const borrow = async (
    input:string|undefined,
    collInput:string|undefined,
    vault: string| null = null,
  ) => {
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = collInput ? ethers.utils.parseEther(collInput) : ethers.constants.Zero;

    const randVault = ethers.utils.hexlify(ethers.utils.randomBytes(12));

    vault && transact(ladle, 'pour', [vault, account, _input, _collInput]);
    !vault && console.log(randVault, activeSeries.seriesId, activeAsset.id);

    !vault && multiCall(
      ladle,
      [
        { fnName: 'build', args: [randVault, activeSeries.seriesId, activeAsset.id] },
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

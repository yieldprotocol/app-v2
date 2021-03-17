import { Contract } from 'ethers';
import { useContext } from 'react';
import { toast } from 'react-toastify';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';

interface callData {
  fnName: string;
  args: any[];
}

/* Generic hook for chain transactions */
export const useChain = () => {
  const { chainState } = useContext(ChainContext);
  const { txState, txActions } = useContext(TxContext);
  const { handleTx, handleTxRejection } = txActions;

  const sign = async (pid:string|null = null) => {
    if (chainState.signer) {
      let res;
      try {
        // const _contract = contract.connect(chainState.signer) as any;
        // res = await _contract[fnName](...args);
      } catch (e) {
        handleTxRejection(e);
      }
      res && console.log(res);
      res && handleTx(res);
      return res;
    }
    // TODO handle no wallet error better?
    toast.error('No wallet connected');
    return null;
  };

  const transact = async (contract:Contract, fnName:string, args:any[], pid:string|null = null) => {
    if (chainState.signer) {
      let res;
      try {
        const _contract = contract.connect(chainState.signer) as any;
        res = await _contract[fnName](...args);
      } catch (e) {
        handleTxRejection(e);
      }
      res && console.log(res);
      res && handleTx(res);
      return res;
    }
    // TODO handle no wallet error better?
    toast.error('No wallet connected');
    return null;
  };

  /* Generic hook for readonly chain calls (view fns) */
  const read = async (contract:Contract, fnName:string, args:any[]) => {
    try {
      const _contract = contract as any;
      return _contract[fnName](args);
    } catch (e) {
      toast.error('Check Network Connection');
    }
    return null;
  };

  const multiCall = async (contract:Contract, fnList:callData[], pid:string|null = null) => {
    const calls = fnList.map((x:any) => contract.interface.encodeFunctionData(x.fnName, x.args));
    if (chainState.signer) {
      let res;
      try {
        const _contract = contract.connect(chainState.signer) as any;
        res = await _contract.batch(calls, true);
      } catch (e) {
        handleTxRejection(e);
      }
      res && console.log(res);
      res && handleTx(res);
      return res;
    }
    // TODO handle no wallet error better?
    toast.error('No wallet connected');
    return null;
  };

  return { sign, transact, read, multiCall };
};

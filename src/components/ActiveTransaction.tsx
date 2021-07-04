import { TransactionDescription } from 'ethers/lib/utils';
import { Box, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { TxContext } from '../contexts/TxContext';
import { TxState } from '../types';

function ActiveTransaction({ txCode, children }: { txCode:string, children: React.ReactNode }) { // TODO consider name: TxPendingWrap
  const { txState } = useContext(TxContext);

  const { signatures, transactions, processes, txPending, signPending } = txState;

  const [sig, setSig] = useState<any>();
  const [tx, setTx] = useState<any>();

  useEffect(() => {
    const _process = processes.get(txCode);
    _process && setTx(transactions.get(_process));
    _process && setSig(signatures.get(txCode));
  }, [processes, signatures, transactions, txCode]);

  /**
   *
   * STATE 1 : If process isnt active, simply return the children;
   * sTATE 2: tx complete success
   * state 3: tx fail
   * */

  return (
    <>

      {console.log(processes.get(txCode), sig, tx)}

      {!processes.get(txCode) && // CASE: no tx or signing activity
      !tx &&
      !sig &&
      <Box> {children} </Box>}

      {processes.get(txCode) &&
        sig?.status === TxState.PENDING && // CASE: Signature/ approval required
        <Text>
          Signature or Approval required. [todo graphic/animation]
          Please check your wallet/provider.
        </Text>}

      {processes.get(txCode) &&
        sig?.status === TxState.PENDING && // CASE: Approval transaction pending (sig pending and tx pending)
        tx?.status === TxState.PENDING &&
        <Text>
          Approval transaction pending... [todo graphic/animation]
        </Text>}

      {processes.get(txCode) &&
       processes.get(txCode) === '0x0' &&
       sig?.status !== TxState.PENDING &&
       !tx &&
       <Box>
         <Text>
           Awaiting Confirmation...  [todo graphic/animation]
           Please check your wallet/provider.
         </Text>
       </Box>}

      {processes.get(txCode) && // CASE: TX processing but signature complete
      tx?.status === TxState.PENDING &&
      (!sig || sig?.status === TxState.SUCCESSFUL) &&
      <Text>
        Transaction Pending... [todo graphic/animation]
      </Text>}

      { tx?.status === TxState.SUCCESSFUL && // Case:  TX complete. if process still active, assume that the tx was an approval.
        (processes.get(txCode) ?
          <Box>
            APPROVAL TX COMPLETE.
            Please confirm your transaction with your wallet provider.
          </Box>
          :
          <Box>
            TX COMPLETE  [todo tx complete animation]
          </Box>
        )}

      { tx?.status === TxState.FAILED && // Case: transaction failed.
        <Box>
          TX FAILED [todo tx complete animation]
        </Box>}
    </>
  );
}

export default ActiveTransaction;

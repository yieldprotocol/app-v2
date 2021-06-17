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
      {
      // If there is a active process AND trasaction status is not known
      processes.get(txCode) &&
      <Box>
        { signPending && sig && <Text> Signature required... [todo graphic/animation]</Text>}
        { !txPending && !signPending && !tx && <Text> Awaiting Confirmation... [todo graphic/animation] </Text>}
      </Box>
      }

      {!processes.get(txCode) &&
      !tx &&
      <Box> {children} </Box>}

      {processes.get(txCode) &&
      tx &&
      <Text>
        Transaction Pending... [todo graphic/animation]
      </Text>}

      { tx?.status === TxState.SUCCESSFUL && <Box> TX COMPLETE  [todo tx complete animation]</Box>}
      { tx?.status === TxState.FAILED && <Box> TX FAILED [todo tx complete animation] </Box>}
    </>
  );
}

export default ActiveTransaction;

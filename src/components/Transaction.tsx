import { Box, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { TxContext } from '../contexts/TxContext';

function Transaction({ txCode, children }: { txCode:string, children: React.ReactNode }) { // TODO consider name: TxPendingWrap
  const { txState } = useContext(TxContext);

  const { signatures, transactions, processes, txPending, signPending } = txState;

  const [sig, setSig] = useState<any>();
  const [tx, setTx] = useState<any>();
  const [processActive, setProcessActive] = useState<string>();

  useEffect(() => {
    processActive && setTx(transactions.get(processActive));
  }, [processActive, transactions]);

  useEffect(() => {
    const _process = processes.get(txCode);
    setProcessActive(_process);
  }, [processes, txCode]);

  useEffect(() => {
    setSig(signatures.get(txCode));
  }, [signatures, txCode]);

  // processActive && console.log(processActive);
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
      processActive && !(tx?.status === 'success' || tx?.status === 'failed')
        ? (
          <Box>
            { signPending && sig && <Text> Signature required... </Text>}
            { !txPending && !signPending && <Text> Awaiting Confirmation... </Text>}
            { txPending && tx && <Text> Transaction Pending... </Text>}
          </Box>)
        :
          <Box> {children} </Box>
      }
      {console.log(tx?.status)}
      { tx?.status === 'success' && <Box> TX COMPLETE </Box>}
      { tx?.status === 'failed' && <Box> TX FAILED </Box>}
    </>
  );
}

export default Transaction;

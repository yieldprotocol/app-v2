import { TransactionDescription } from 'ethers/lib/utils';
import { Box, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { BiWallet } from 'react-icons/bi';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiPenTool, FiX } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import { TxState } from '../types';

function ActiveTransaction({
  txCode,
  size,
  children,
}: {
  txCode: string;
  children: React.ReactNode;
  size?: 'SMALL' | 'LARGE';
}) {
  // TODO consider name: TxPendingWrap
  const { txState } = useContext(TxContext);

  const { signatures, transactions, processes, txPending, signPending } = txState;

  const [sig, setSig] = useState<any>();
  const [tx, setTx] = useState<any>();

  const [textSize, setTextSize] = useState<string|undefined>(undefined)
  const [iconSize, setIconSize] = useState<string>('1em')

  useEffect(() => {
    const _process = processes.get(txCode);
    _process && setTx(transactions.get(_process));
    _process && setSig(signatures.get(txCode));

    console.log(sig);
  }, [processes, signatures, transactions, txCode]);

  useEffect(()=>{
    size === 'SMALL' ? setTextSize(undefined): setTextSize(undefined);
    size === 'SMALL' ? setIconSize('1em'): setIconSize('2em') ;
  }, [size] )

  /**
   *
   * STATE 1 : If process isnt active, simply return the children;
   * sTATE 2: tx complete success
   * state 3: tx fail
   * */

  return (
    <Box background='grey' fill >
      {!processes.get(txCode) && // CASE: no tx or signing activity
        !sig &&
        !tx &&
        <Box>{children}</Box>}

        {// CASE: no tx or signing rejected by user
        ( sig?.status===TxState.REJECTED || tx?.status===TxState.REJECTED ) &&
        <Box>{children}</Box>}


      {processes.get(txCode) &&
        sig?.status === TxState.PENDING && ( // CASE: Signature/ approval required
          <Box direction="row" align="center" gap="medium" pad="medium">
            <FiPenTool size={iconSize} />
            <Box>
              <Text size={textSize}>Signature or Approval required.</Text>
              <Text size="xsmall">Please check your wallet/provider.</Text>
            </Box>
          </Box>
        )}

      {processes.get(txCode) &&
        sig?.status === TxState.PENDING && // CASE: Approval transaction pending (sig pending and tx pending)
        tx?.status === TxState.PENDING && (
          <Box direction="row" align="center" gap="medium" pad="medium">
            <FiClock size={iconSize} />
            <Box>
              <Text size={textSize} >Token Approval / Authorization</Text>
              <Text size="xsmall">Transaction Pending...</Text>
            </Box>
          </Box>
        )}

      {processes.get(txCode) && processes.get(txCode) === '0x0' && sig?.status !== TxState.PENDING && !tx && (
        <Box direction="row" align="center" gap="medium" pad="medium">
          <BiWallet size={iconSize} />
          <Box>
            <Text size={textSize} >Awaiting Transaction Confirmation...</Text>
            <Text size="xsmall">Please check your wallet/provider.</Text>
          </Box>
        </Box>
      )}

      {processes.get(txCode) && // CASE: TX processing but signature complete
        tx?.status === TxState.PENDING &&
        (!sig || sig?.status === TxState.SUCCESSFUL) && (
          <Box direction="row" align="center" gap="medium" pad="medium">
            <FiClock size={iconSize} />
            <Box>
              <Text size={textSize} >Transaction Pending...</Text>
              <Text size="xsmall">{tx.hash}</Text>
            </Box>
          </Box>
        )}

      {tx?.status === TxState.SUCCESSFUL && // Case:  TX complete. if process still active, assume that the tx was an approval.
        (processes.get(txCode) ? (
          <Box direction="row" align="center" gap="medium" pad="medium">
            <FiClock size={iconSize} />
            <Box>
              <Text size={textSize} >Approval Transaction complete</Text>
              <Text size="xsmall">Please check your wallet/provider to confirm transaction.</Text>
            </Box>
          </Box>
        ) : (
          <Box direction="row" align="center" gap="medium" pad="medium">
            <FiCheckCircle size={iconSize} />
            <Box>
              <Text size={textSize} >Transaction Complete</Text>
              <Text size="xsmall">{tx.hash} </Text>
            </Box>
          </Box>
        ))}

      {tx?.status === TxState.FAILED && ( // Case: transaction failed.
        <Box direction="row" align="center" gap="medium" pad="medium">
          <FiX size={iconSize} />
          <Box>
            <Text size={textSize}>Transaction Failed</Text>
            <Text size="xsmall">{tx.hash} </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}

ActiveTransaction.defaultProps = { size: 'SMALL' };

export default ActiveTransaction;

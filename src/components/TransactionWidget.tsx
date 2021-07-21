import { Box, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { BiWallet } from 'react-icons/bi';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiPenTool, FiX, FiXCircle } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import { TxState } from '../types';
import { abbreviateHash } from '../utils/appUtils';

const TransactionWidget = () => {
  const { txState } = useContext(TxContext);
  const { signatures, transactions, processes } = txState;

  const [processArray, setProcessArray] = useState<any[]>([]);
  const [sigArray, setSigArray] = useState<any[]>([]);
  const [txArray, setTxArray] = useState<any[]>([]);

  /* convert maps to arrays */
  useEffect(() => {
    setProcessArray(Array.from(processes.values()));
    setTxArray(Array.from(transactions.values()));
    setSigArray(Array.from(signatures.values()));
  }, [processes, signatures, transactions]);

  /* convert maps to arrays */
  useEffect(() => {
    console.log(processArray);
    console.log(sigArray);
    console.log(txArray);
  }, [processArray, sigArray, txArray]);

  return (
    <Box round="xsmall" pad={{ horizontal: 'medium', vertical: 'xsmall' }} elevation="xsmall" gap="xsmall">
      {txArray.some((x: any) => x.status === TxState.PENDING) && (
        <>
          <Box direction="row" gap="medium" align="center">
            <FiClock />
            <Box>
            <Text size="small">Transaction Pending</Text>
              <Text size="xsmall">{abbreviateHash(txArray[0].tx.hash)}</Text>
            </Box>
          </Box>
        </>
      )}

      {processArray.length && !txArray.some((x: any) => x.status === TxState.PENDING) && (
        <>
          <Box direction="row" gap="medium" align="center">
            <FiAlertTriangle />
            <Box>
              <Text size="small">Action Required</Text>
              <Text size="xsmall">Check your wallet</Text>
            </Box>
          </Box>
        </>
      )}

      {!processArray.length && txArray.some((x: any) => x.status === TxState.SUCCESSFUL) && (
        <Box direction="row" gap="small">
          <FiCheckCircle />
          <Text size="xsmall"> Transaction Complete </Text>
        </Box>
      )}
      {!processArray.length && txArray.some((x: any) => x.status === TxState.FAILED) && (
        <Box direction="row" gap="small">
          <FiXCircle />
          <Text size="xsmall"> Transaction Failed </Text>
        </Box>
      )}
    </Box>
  );
};

export default TransactionWidget;

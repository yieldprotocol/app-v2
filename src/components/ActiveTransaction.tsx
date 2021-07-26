import { Box, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { BiWallet } from 'react-icons/bi';
import { FiCheckCircle, FiClock, FiPenTool, FiX } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
import { ApprovalType, TxState } from '../types';
import { abbreviateHash } from '../utils/appUtils';
import EtherscanButton from './buttons/EtherscanButton';
import CopyWrap from './wraps/CopyWrap';

const InfoBlock = ({
  title,
  subTitle,
  icon,
  button,
  full,
}: {
  title: any;
  icon: any;
  button: any;
  subTitle: any;
  full: boolean|undefined;
}) => (
  <Box
    direction={full ? 'column' : 'row'}
    align="center"
    justify={full ? 'center' : 'start'}
    gap='large'
    pad={{ vertical: 'large' }}
  >
    {console.log(full)}
    {icon}
    <Box gap={full ? 'medium' : undefined} align="center">
      <Text size={full ? 'large':'medium'}>{title}</Text>
      <Text size={full ? 'small' : 'xsmall'}>{subTitle}</Text>
    </Box>
    {button}
  </Box>
);

const ActiveTransaction = ({
  txCode,
  full,
  children,
  pad,
}: {
  txCode: string;
  children: React.ReactNode;
  full?: boolean;
  pad?: boolean;
}) => {
  // TODO consider name: TxPendingWrap
  const { txState } = useContext(TxContext);
  const {
    userState: { approvalMethod },
  } = useContext(UserContext);

  const { signatures, transactions, processes } = txState;

  const [process, setProcess] = useState<any>();
  const [sig, setSig] = useState<any>();
  const [tx, setTx] = useState<any>();

  const [textSize, setTextSize] = useState<string | undefined>(undefined);
  const [iconSize, setIconSize] = useState<string>('1em');

  useEffect(() => {
    const _process = processes.get(txCode);
    _process && setTx(transactions.get(_process));
    _process && setSig(signatures.get(txCode));
  }, [processes, signatures, transactions, txCode]);

  return (
    <Box fill pad={pad ? {vertical: 'medium'} : undefined}>
      {!processes.get(txCode) && // CASE: no tx or signing activity
        (!sig || sig?.status === TxState.REJECTED || sig?.status === TxState.SUCCESSFUL) &&
        !tx && <Box>{children}</Box>}

      {processes.get(txCode) &&
        sig?.status === TxState.PENDING && ( // CASE: Signature/ approval required
          <InfoBlock
            title={approvalMethod === ApprovalType.SIG ? 'Signature required' : 'Approval transaction required'}
            subTitle={
              approvalMethod === ApprovalType.SIG
                ? 'Please check your wallet/provider'
                : 'Confirm approval transaction with your wallet/provider'
            }
            icon={<FiPenTool size={iconSize} />}
            button={null}
            full = {full}
          />
        )}

      {processes.get(txCode) &&
        sig?.status === TxState.PENDING && // CASE: Approval transaction pending (sig pending and tx pending)
        tx?.status === TxState.PENDING && (
          <InfoBlock
            title="Token Approval"
            subTitle="Transaction Pending..."
            icon={<FiClock size={iconSize} />}
            button={<EtherscanButton txHash={tx.tx.hash} />}
            full = {full}
          />
        )}

      {processes.get(txCode) && processes.get(txCode) === '0x0' && sig?.status !== TxState.PENDING && !tx && (
        <InfoBlock
          title="Awaiting Transaction Confirmation..."
          subTitle="Please check your wallet/provider."
          icon={<BiWallet size={iconSize} />}
          button={null}
          full = {full}
        />
      )}

      {processes.get(txCode) && // CASE: TX processing but signature complete
        tx?.status === TxState.PENDING &&
        (!sig || sig?.status === TxState.SUCCESSFUL) && (
          <InfoBlock
            title="Transaction Pending..."
            subTitle={<CopyWrap hash={tx.tx.hash}> {abbreviateHash(tx.tx.hash, 6)} </CopyWrap>}
            icon={<FiClock size={iconSize} />}
            button={<EtherscanButton txHash={tx.tx.hash} />}
            full = {full}
          />
        )}

      {tx?.status === TxState.SUCCESSFUL && // Case:  TX complete. if process still active, assume that the tx was an approval.
        (processes.get(txCode) ? (
          <InfoBlock
            title="Token Approval Complete"
            subTitle="Please check your wallet/provider to confirm second step"
            icon={<FiClock size={iconSize} />}
            button={<EtherscanButton txHash={tx.tx.hash} />}
            full = {full}
          />
        ) : (
          <InfoBlock
            title="Transaction Complete"
            subTitle={<CopyWrap hash={tx.tx.hash}> {abbreviateHash(tx.tx.hash, 6)} </CopyWrap>}
            icon={<FiCheckCircle size={iconSize} />}
            button={<EtherscanButton txHash={tx.tx.hash} />}
            full = {full}
          />
        ))}

      {tx?.status === TxState.FAILED && ( // Case: transaction failed.
        <InfoBlock
          title="Transaction Failed"
          subTitle={<CopyWrap hash={tx.tx.hash}> {abbreviateHash(tx.tx.hash, 6)} </CopyWrap>}
          icon={<FiX size={iconSize} />}
          button={<EtherscanButton txHash={tx.tx.hash} />}
          full = {full}
        />
      )}
    </Box>
  );
};

ActiveTransaction.defaultProps = { full: false, pad: false };

export default ActiveTransaction;

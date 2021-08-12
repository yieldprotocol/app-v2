import { constants } from 'ethers';
import { Box, Button, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { BiWallet } from 'react-icons/bi';
import { FiCheckCircle, FiClock, FiPenTool, FiX } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
import { useTx } from '../hooks/useTx';
import { ActionCodes, ApprovalType, TxState } from '../types';
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
  full: boolean | undefined;
}) => (
  <>
    {full ? (
      <Box direction="column" align="center" justify="center" gap="large" pad={{ vertical: 'large' }}>
        {icon}
        <Box gap="medium" align="center">
          <Text size="large">{title}</Text>
          <Text size="small">{subTitle}</Text>
        </Box>
        {button}
      </Box>
    ) : (
      <Box gap="medium">
        <Box direction="row" gap="medium" pad="medium" align="center" justify="center">
          {icon}
          <Box gap="xsmall" align="center" justify="start">
            <Text size="medium">{title}</Text>
            <Box direction="row" gap="xsmall">
              <Text size="small">{subTitle}</Text>
            </Box>
          </Box>
        </Box>
        <Box alignSelf="end">{button}</Box>
      </Box>
    )}
  </>
);

const ActiveTransaction = ({
  tx,
  full,
  children,
  pad,
}: {
  tx: any;
  children: React.ReactNode;
  full?: boolean;
  pad?: boolean;
}) => {
  const { txState } = useContext(TxContext);
  const { signatures } = txState;
  const {
    userState: { approvalMethod },
  } = useContext(UserContext);

  const [sig, setSig] = useState<any>();
  const [iconSize, setIconSize] = useState<string>('1em');

  useEffect(() => {
    console.log('HERE', tx);
  }, [tx]);

  useEffect(() => {
    tx.txCode && setSig(signatures.get(tx.txCode));
  }, [tx, signatures]);

  useEffect(() => {
    full && setIconSize('2.5em');
    !full && setIconSize('1.5em');
  }, [full]);

  return (
    <Box pad={pad ? { horizontal: 'small', vertical: 'medium' } : undefined}>
      {!tx.processActive && // CASE: no tx or signing activity
        (!sig || sig?.status === TxState.REJECTED || sig?.status === TxState.SUCCESSFUL) &&
        !tx.success &&
        !tx.failed &&
        !tx.rejected && <Box>{children}</Box>}

      {tx.processActive &&
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
            full={full}
          />
        )}

      {tx.processActive &&
        sig?.status === TxState.PENDING && // CASE: APPROVAL transaction pending (sig pending and tx pending)
        tx.pending && (
          <InfoBlock
            title="Token Approval"
            subTitle="Transaction Pending..."
            icon={<FiClock size={iconSize} />}
            button={<EtherscanButton txHash={tx.txHash} />}
            full={full}
          />
        )}

      {tx.processActive && !tx.txHash && sig?.status !== TxState.PENDING && (
        <InfoBlock
          title="Transaction Confirmation..."
          subTitle="Please check your wallet/provider."
          icon={<BiWallet size={iconSize} />}
          button={null}
          full={full}
        />
      )}

      {tx.processActive && // CASE: TX processing but signature complete
        tx.pending &&
        (!sig || sig?.status === TxState.SUCCESSFUL) && (
          <InfoBlock
            title="Transaction Pending..."
            subTitle={<CopyWrap hash={tx.txHash}> {abbreviateHash(tx.txHash, 6)} </CopyWrap>}
            icon={<FiClock size={iconSize} />}
            button={<EtherscanButton txHash={tx.txHash} />}
            full={full}
          />
        )}

      {/* {tx.processActive &&
        sig?.status === TxState.SUCCESSFUL &&
        tx.success && ( // Case:  TX complete. if process still active, assume that the tx was an approval.
          <InfoBlock
            title="Token Approval Complete"
            subTitle="Please check your wallet/provider to confirm second step"
            icon={<FiClock size={iconSize} />}
            button={<EtherscanButton txHash={tx.txHash} />}
            full={full}
          />
        )} */}

      {!tx.processActive &&
        tx.success && (
        <InfoBlock
          title="Transaction Complete"
          subTitle={<CopyWrap hash={tx.txHash}> {abbreviateHash(tx.txHash, 6)} </CopyWrap>}
          icon={<FiCheckCircle size={iconSize} />}
          button={<EtherscanButton txHash={tx.txHash} />}
          full={full}
        />
      )}

      {
      !tx.processActive &&
      tx.failed && ( // Case: transaction failed.
        <InfoBlock
          title="Transaction Failed"
          subTitle={<CopyWrap hash={tx.txHash}> {abbreviateHash(tx.txHash, 6)} </CopyWrap>}
          icon={<FiX size={iconSize} />}
          button={<EtherscanButton txHash={tx.txHash} />}
          full={full}
        />
      )}
    </Box>
  );
};

ActiveTransaction.defaultProps = { full: false, pad: false };

export default ActiveTransaction;

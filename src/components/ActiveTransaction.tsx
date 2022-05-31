import React, { useContext } from 'react';
import { Box, Spinner, Text } from 'grommet';
import { ThemeContext } from 'styled-components';
import { BiWallet } from 'react-icons/bi';
import { FiCheckCircle, FiPenTool, FiX } from 'react-icons/fi';
import { ApprovalType, IYieldProcess, ProcessStage, TxState } from '../types';
import EtherscanButton from './buttons/EtherscanButton';
import CancelButton from './buttons/CancelButton';
import { useApprovalMethod } from '../hooks/useApprovalMethod';

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
      <Box direction="column" align="center" justify="center" pad={{ vertical: 'large' }}>
        <Box gap="small">
          <Box direction="row" gap="medium" alignSelf="start">
            {icon}
            <Text size="large"> {title}</Text>
          </Box>
          <Box direction="row" gap="medium" fill="horizontal" alignContent="end">
            <Box fill align="end">
              <Text size="small" weight="lighter">
                {subTitle}
              </Text>
            </Box>
            {button && (
              <Box flex={false} alignSelf="end">
                {button}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    ) : (
      <Box gap="medium">
        <Box direction="row" gap="medium" pad="medium" align="center">
          {icon}
          <Box gap="xsmall">
            <Text size="medium">{title}</Text>
            <Box direction="row" gap="xsmall">
              <Box fill align="end">
                <Text size="small" weight="lighter">
                  {subTitle}
                </Text>
              </Box>
            </Box>
            <Box alignSelf="end">{button}</Box>
          </Box>
        </Box>
      </Box>
    )}
  </>
);

const ActiveTransaction = ({
  txProcess,
  full,
  children,
  pad,
  cancelAction,
}: {
  txProcess: IYieldProcess | undefined;
  children: React.ReactNode;
  cancelAction?: () => void;
  full?: boolean;
  pad?: boolean;
}) => {
  const theme = useContext(ThemeContext);
  const { green } = theme.global.colors;

  const approvalMethod = useApprovalMethod();
  const iconSize = '1.5em';
  const activeProcess = txProcess;

  return (
    <Box pad={pad ? { vertical: 'medium' } : undefined} align={full ? 'center' : undefined}>
      {!full && (activeProcess?.stage === ProcessStage.PROCESS_INACTIVE || !activeProcess) && (
        <Box justify="between" direction="row" pad="xsmall">
          <Text size="xsmall">Review Transaction</Text>
          {!full && <CancelButton action={cancelAction ? () => cancelAction() : () => null} />}
        </Box>
      )}

      <Box
        background={full ? undefined : 'gradient-transparent'}
        round="xsmall"
        pad={full ? { horizontal: 'large' } : 'small'}
        height={full ? undefined : { min: '100px' }}
        fill
      >
        {(activeProcess?.stage === ProcessStage.PROCESS_INACTIVE || !activeProcess) && (
          <>
            {full && (
              <Text size="large" weight="lighter">
                Review Transaction
              </Text>
            )}
            {children}
          </>
        )}

        {activeProcess?.stage === ProcessStage.SIGNING_REQUESTED && (
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

        {activeProcess?.stage === ProcessStage.SIGNING_TRANSACTION_PENDING && (
          <InfoBlock
            title="Token Approval"
            subTitle="Transaction Pending..."
            icon={<Spinner color="brand" size="small" />}
            button={<EtherscanButton txHash={activeProcess.txHash} />}
            full={full}
          />
        )}

        {activeProcess?.stage === ProcessStage.TRANSACTION_REQUESTED && (
          <InfoBlock
            title="Transaction Confirmation..."
            subTitle="Please check your wallet/provider."
            icon={<BiWallet size={iconSize} />}
            button={null}
            full={full}
          />
        )}

        {activeProcess?.stage === ProcessStage.TRANSACTION_PENDING && (
          <InfoBlock
            title="Transaction Pending..."
            // subTitle={<CopyWrap hash={activeProcess.txHash}> {abbreviateHash(activeProcess.txHash, 3)} </CopyWrap>}
            subTitle={null}
            icon={<Spinner color="brand" size="small" />}
            button={<EtherscanButton txHash={activeProcess.txHash} />}
            full={full}
          />
        )}

        {activeProcess?.stage === ProcessStage.PROCESS_COMPLETE && activeProcess.tx.status === TxState.SUCCESSFUL && (
          <InfoBlock
            title="Transaction Complete"
            // subTitle={<CopyWrap hash={activeProcess.txHash}> {abbreviateHash(activeProcess.txHash, 3)} </CopyWrap>}
            subTitle={null}
            icon={<FiCheckCircle size={iconSize} color={green} />}
            button={<EtherscanButton txHash={activeProcess.txHash} />}
            full={full}
          />
        )}

        {activeProcess?.stage === ProcessStage.PROCESS_COMPLETE && activeProcess.tx.status === TxState.FAILED && (
          <InfoBlock
            title="Transaction Failed"
            subTitle={null}
            // subTitle={<CopyWrap hash={activeProcess.txHash}> {abbreviateHash(activeProcess.txHash, 3)} </CopyWrap>}
            icon={<FiX size={iconSize} />}
            button={<EtherscanButton txHash={activeProcess.txHash} />}
            full={full}
          />
        )}
      </Box>
    </Box>
  );
};

ActiveTransaction.defaultProps = { full: false, pad: false, cancelAction: () => null };

export default ActiveTransaction;

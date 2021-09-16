import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Text } from 'grommet';
import { BiWallet } from 'react-icons/bi';
import { FiCheckCircle, FiClock, FiPenTool, FiX } from 'react-icons/fi';
import ParticlesBg from 'particles-bg';

import { UserContext } from '../contexts/UserContext';
import { useProcess } from '../hooks/useProcess';
import { ActionCodes, ApprovalType, IYieldProcess, ProcessStage, TxState } from '../types';
import { abbreviateHash } from '../utils/appUtils';
import EtherscanButton from './buttons/EtherscanButton';
import CopyWrap from './wraps/CopyWrap';
import CancelButton from './buttons/CancelButton';

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
          {button}
        </Box>  
      </Box>
    ) : (
      <Box gap="medium">
        <Box direction="row" gap="medium" pad="medium" align="center" justify="center">
          {icon}
          <Box gap="xsmall">
            <Text size="medium">{title}</Text>
            <Box direction="row" gap="xsmall">
              <Text size="small" color="text-weak">
                {subTitle}
              </Text>
            </Box>
          </Box>
        </Box>
        <Box alignSelf="center">{button}</Box>
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
  txProcess: IYieldProcess| undefined;
  children: React.ReactNode;
  cancelAction?: ()=>void ;
  full?: boolean;
  pad?: boolean;
}) => {

  const {
    userState: { approvalMethod },
  } = useContext(UserContext);

  const { pathname } = useLocation();

  const [iconSize, setIconSize] = useState<string>(full ? '2.5em' : '1.5em');

  const activeProcess = txProcess;

  useEffect(()=>{

  })

  return (
    <Box pad={pad ? { horizontal: 'small', vertical: 'medium' } : undefined} >

      {!full &&
      (activeProcess?.stage === ProcessStage.PROCESS_INACTIVE || !activeProcess) &&
        <Box justify='between' direction='row' pad='xsmall'>
        <Text size='xsmall'> Review Transaction </Text>
        {!full && <CancelButton action = {cancelAction ? ()=>cancelAction() : ()=>null}  /> }
        </Box>
      }
      <Box 
        background='gradient-transparent' 
        round='xsmall'
      > 

      {(activeProcess?.stage === ProcessStage.PROCESS_INACTIVE || !activeProcess) && (
      <Box gap='small' pad='small'>
        {full && <Text size='medium'> Review Transaction </Text>}
        {children}   
      </Box>)}

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
          icon={<FiClock size={iconSize} />}
          button={<EtherscanButton txHash={activeProcess.tx.hash} />}
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
          subTitle={<CopyWrap hash={activeProcess.txHash}> {abbreviateHash(activeProcess.txHash, 6)} </CopyWrap>}
          icon={<FiClock size={iconSize} />}
          button={<EtherscanButton txHash={activeProcess.txHash} />}
          full={full}
        />
      )}

      {activeProcess?.stage === ProcessStage.PROCESS_COMPLETE 
      && activeProcess.tx.status === TxState.SUCCESSFUL && (
        <InfoBlock
          title="Transaction Complete"
          subTitle={<CopyWrap hash={activeProcess.txHash}> {abbreviateHash(activeProcess.txHash, 6)} </CopyWrap>}
          icon={<FiCheckCircle size={iconSize} />}
          button={
              <EtherscanButton txHash={activeProcess.txHash} />
          }
          full={full}
        />
      )}

      {activeProcess?.stage === ProcessStage.PROCESS_COMPLETE 
      && activeProcess.tx.status === TxState.FAILED && (
        <InfoBlock
          title="Transaction Failed"
          subTitle={<CopyWrap hash={activeProcess.txHash}> {abbreviateHash(activeProcess.txHash, 6)} </CopyWrap>}
          icon={<FiX size={iconSize} />}
          button={<EtherscanButton txHash={activeProcess.txHash} />}
          full={full}
        />
      )}
      </Box>
    </Box>
  );
};

ActiveTransaction.defaultProps = { full: false, pad: false, cancelAction: ()=>null };

export default ActiveTransaction;

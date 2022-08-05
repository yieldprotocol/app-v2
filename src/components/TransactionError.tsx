import { useContext, useState } from 'react';
import { Anchor, Box, Layer, Text } from 'grommet';
import { FiAlertTriangle } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import CopyWrap from './wraps/CopyWrap';
import ApprovalSetting from './settings/ApprovalSetting';

const TransactionError = () => {
  const { txState, txActions } = useContext(TxContext);

  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  return (
    <>
      {txState.txWillFail && (
        <Layer onClickOutside={() => txActions.handleTxWillFail()} responsive>
          <Box pad="large" round="small" gap="small" width="600px">
            <Box fill="horizontal" align="center" direction="row" gap="medium" pad="small">
              <FiAlertTriangle size="2em" />
              Transaction aborted
            </Box>

            <Box pad="small">
              <Text size="small">
                It seems your transaction was likely to fail, and so it was aborted before being submitted.{' '}
                <Anchor
                  href="https://docs.yieldprotocol.com/#/troubleshooting"
                  target="_blank"
                  label="Learn more."
                  size="small"
                />
              </Text>
            </Box>

            {txState.txWillFailInfo.error &&
              (txState.txWillFailInfo.error.message.split('execution reverted: ')[1] ===
                'ERC20: Insufficient approval' ||
                txState.txWillFailInfo.error.message.split('execution reverted: ')[1] ===
                  'Dai/insufficient-allowance' ||
                txState.txWillFailInfo.error.message.split('execution reverted: ')[1] ===
                  'ERC20: transfer amount exceeds allowance' ||
                txState.txWillFailInfo.error.message.split('execution reverted: ')[1] ===
                  'ERC20: insufficient allowance' ||
                txState.txWillFailInfo.error.message.split('execution reverted: ')[1] ===
                  'ERC20: transfer amount exceeds allowance') && (
                <Box pad="medium" gap="small">
                  <Box gap="small">
                    <Text size="small" weight="bold">
                      Not all wallets support signing EIP-2612 permits (eg. Ledger, Trezor or contract wallets).
                    </Text>
                    <Text size="small">
                      Most wallets can still be used on the protocol, but you will be required to make token approvals
                      as individual transactions (Optionally, you can also set the approval to the maximum amount).
                    </Text>
                  </Box>
                  <ApprovalSetting />
                </Box>
              )}

            <Box pad="small">
              {txState.txWillFailInfo.error && (
                <Box gap="small">
                  <Text size="small">Diagnostics</Text>
                  <Box pad="small" border gap="small" round="small">
                    <Text size="xsmall">
                      Reason for revert: {txState.txWillFailInfo.error.message.split('execution reverted: ')[1]}
                    </Text>

                    <Box onClick={() => setShowDiagnostics(!showDiagnostics)}>
                      {showDiagnostics ? (
                        <Text size="xsmall" wordBreak="break-word">
                          {JSON.stringify({
                            transaction: txState.txWillFailInfo.transaction,
                            error: txState.txWillFailInfo.error,
                            blocknum: txState.txWillFailInfo.blocknum,
                          })}
                        </Text>
                      ) : (
                        <Text size="xsmall" truncate>
                          {JSON.stringify(txState.txWillFailInfo.transaction.data)}
                          {txState.txWillFailInfo.blocknum}
                        </Text>
                      )}
                    </Box>

                    <Box alignSelf="end">
                      <CopyWrap
                        hash={JSON.stringify({
                          transaction: txState.txWillFailInfo.transaction,
                          error: txState.txWillFailInfo.error,
                          blocknum: txState.txWillFailInfo.blocknum,
                        })}
                      >
                        <Text size="xsmall">Copy diagnostic information</Text>
                      </CopyWrap>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default TransactionError;

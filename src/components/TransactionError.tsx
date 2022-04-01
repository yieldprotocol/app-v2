import { useContext } from 'react';
import { Box, Layer, Text } from 'grommet';
import { FiAlertTriangle } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import { ChainContext } from '../contexts/ChainContext';
import GeneralButton from './buttons/GeneralButton';

const TransactionError = () => {
  const { txState, txActions } = useContext(TxContext);

  const {
    chainActions: { connect },
  } = useContext(ChainContext);

  const handleChangeConnection = (connection: string) => {
    connect(connection);
    txActions.handleTxWillFail();
  };

  return (
    <>
      {txState.txWillFail && (
        <Layer onClickOutside={() => txActions.handleTxWillFail()} responsive>
          <Box pad="large" round="small" gap="small" width="600px">
            <Box fill="horizontal" align="center" direction="row" gap="medium" pad="small">
              <FiAlertTriangle size="2em" /> Transaction aborted
            </Box>

            <Box pad="small">
              <Text size="small">
                It seems your transaction was likely to fail, and so it was aborted before being submitted.{' '}
              </Text>
            </Box>

            <Box pad="small" gap="medium">
              <Box gap="xsmall">
                <Text size="small">
                  The most common cause is using a using a wallet (eg. Ledger, Trezor or contract wallet) that does not
                  support signing EIP-2612 permits.
                </Text>
                <Text size="small">
                  These wallets can still be used on the protocol, but you will be required to make individual approval
                  transactions.
                </Text>
              </Box>

              <Box gap="xsmall">
                <Text size="small"> Possible solutions: </Text>

                <GeneralButton
                  action={() => handleChangeConnection('ledgerWithMetamask')}
                  background="gradient-transparent"
                >
                  <Text size="small"> Change to Ledger/Trezor supporting connection </Text>
                </GeneralButton>

                <GeneralButton action={() => handleChangeConnection('walletconnect')} background="gradient-transparent">
                  <Text size="small"> Change to walletConnect supporting connection </Text>
                </GeneralButton>
              </Box>
            </Box>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default TransactionError;

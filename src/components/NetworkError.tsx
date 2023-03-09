import { useEffect, useState } from 'react';
import { Box, Button, Layer, Text } from 'grommet';
import { FiAlertCircle } from 'react-icons/fi';
import { useConnect, useDisconnect, useNetwork } from 'wagmi';

const NetworkError = () => {
  const { error } = useConnect();
  const { chain, chains } = useNetwork();
  const { disconnect } = useDisconnect();

  const [showError, setShowError] = useState<boolean>(false);

  useEffect(() => {
    error?.message || chain?.unsupported ? setShowError(true) : setShowError(false);
  }, [chain?.unsupported, error]);

  return (
    <>
      {showError && (
        <Layer>
          <Box pad="medium" round="small" gap="small" align="center" width="600px">
            {chain?.unsupported && (
              <>
                <FiAlertCircle size="2em" />{' '}
                <Text size="large">
                  Chain with id {chain.id} is unsupported. Please make sure you are on a supported network.
                </Text>
              </>
            )}
            {error && (
              <>
                <FiAlertCircle size="2em" /> <Text size="large">Oops. There was a connection error.</Text>
              </>
            )}
            <Text size="small">{error?.message}</Text>
            <Button
              label="Continue without connecting a wallet"
              onClick={() => {
                setShowError(false);
                disconnect();
              }}
            />
          </Box>
        </Layer>
      )}
    </>
  );
};

export default NetworkError;

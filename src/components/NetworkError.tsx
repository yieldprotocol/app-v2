import { useEffect, useState } from 'react';
import { Box, Button, Layer, Text } from 'grommet';
import { FiAlertCircle } from 'react-icons/fi';
import { useConnect, useDisconnect } from 'wagmi';

const NetworkError = () => {
  const { error } = useConnect();
  const { disconnect } = useDisconnect();

  const [showError, setShowError] = useState<boolean>(false);

  useEffect(() => {
    error?.message ? setShowError(true) : setShowError(false);
  }, [error]);

  return (
    <>
      {showError && (
        <Layer>
          <Box pad="medium" round="small" gap="small" align="center" width="600px">
            <FiAlertCircle size="2em" /> <Text size="large">Oops. There was a connection error.</Text>
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

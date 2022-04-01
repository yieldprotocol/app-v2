import { useContext, useEffect, useState } from 'react';
import { Box, Button, Layer, Text } from 'grommet';
import { FiAlertCircle } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';

const NetworkError = () => {
  const {
    chainState: { connection },
    chainActions: { disconnect },
  } = useContext(ChainContext);

  const [showError, setShowError] = useState<boolean>(false);

  useEffect(() => {
    connection.errorMessage || connection.fallbackErrorMessage ? setShowError(true) : setShowError(false);
  }, [connection.errorMessage, connection.fallbackErrorMessage]);

  return (
    <>
      {showError && (
        <Layer>
          <Box pad="medium" round="small" gap="small" align="center" width="600px">
            <FiAlertCircle size="2em" /> <Text size="large">Oops. There was a connection error.</Text>
            <Text size="small"> {connection.errorMessage || connection.fallbackErrorMessage} </Text>
            {!connection.fallbackErrorMessage && (
              <Button
                label="Continue without connecting a wallet"
                onClick={() => {
                  setShowError(false);
                  disconnect();
                }}
              />
            )}
          </Box>
        </Layer>
      )}
    </>
  );
};

export default NetworkError;

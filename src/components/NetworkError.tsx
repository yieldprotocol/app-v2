import React, { useContext, useEffect, useState } from 'react';
import { Box, Layer, Text } from 'grommet';
import { FiAlertCircle } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';

const NetworkError = () => {
  const {
    chainState: { connection } ,
  } = useContext(ChainContext);

  // const [unsupportedNetwork, setUnsupportedNetwork] = useState<boolean>(false);
  // useEffect(() => {
  //   console.log();
  //   if (connection.support)
  //     connection.currentChainInfo.supported ? setUnsupportedNetwork(false) : setUnsupportedNetwork(true);
  // }, [connection]);

  return (
    <Layer>
      <Box pad="medium" round="small" gap="small" align="center" width="600px">
        <FiAlertCircle size="2em" /> <Text size="large">Oops. Unsupported network</Text>
        <Text size="small"> Please connect your wallet to one of the supported networks: </Text>
        <Box gap="xsmall">
          {[...connection.CHAIN_INFO.values()].map((c) =>
            c.supported ? (
              <Text color={c.color} size="small" key={c.name}>
                {c.name}
              </Text>
            ) : null
          )}
        </Box>
      </Box>
    </Layer>
  );
};

export default NetworkError;

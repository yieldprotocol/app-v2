import React, { useContext, useEffect, useState } from 'react';
import { Box, Layer, Text } from 'grommet';
import { FiAlertCircle } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';

const NetworkError = () => {
  const {
    chainState: { connection },
  } = useContext(ChainContext);

  return (
    <>
    { connection.errorMessage &&
    <Layer>
      <Box pad="medium" round="small" gap="small" align="center" width="600px">
        <FiAlertCircle size="2em" /> <Text size="large">Oops. There was a connection error. </Text>
        <Text size="small"> {connection.errorMessage} </Text>
      </Box>
    </Layer>
    }
    </>
  );
};

export default NetworkError;

import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Layer, Text } from 'grommet';
import { FiAlertCircle } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';

const NetworkError = () => {
  const {
    chainState: { connection },
    chainActions: { disconnect }
  } = useContext(ChainContext);

  const [ showError, setShowError] =  useState<boolean>(false);

  useEffect(()=>{
    connection.errorMessage ? setShowError(true) : setShowError(false); 
  },[connection.errorMessage])

  return (
    <>
    { showError &&
    <Layer>
      <Box pad="medium" round="small" gap="small" align="center" width="600px">
        <FiAlertCircle size="2em" /> <Text size="large">Oops. There was a connection error. </Text>
        <Text size="small"> {connection.errorMessage} </Text>

        <Button label='Continue on default network without connecting a wallet' onClick={()=> { setShowError(false); disconnect()}  }/> 
      </Box>
    </Layer>
    }
    </>
  );
};

export default NetworkError;

import { Box, Text, TextInput } from 'grommet';
import { ReactEventHandler, useEffect, useState } from 'react';
import Switch from 'react-switch';
import { useConnection } from '../../hooks/useConnection';
import useTenderly from '../../hooks/useTenderly';
import GeneralButton from '../buttons/GeneralButton';
import InputWrap from '../wraps/InputWrap';

const TenderlyForkSetting = () => {
  const { connectionState, connectionActions } = useConnection();
  const [rpcUrlInput, setRpcUrlInput] = useState<string>();
  const { fillEther } = useTenderly();

  const handleSubmit = () => {
    if (rpcUrlInput !== connectionState.tenderlyForkRpcUrl) {
      connectionActions.useTenderly(rpcUrlInput);
      rpcUrlInput && window.location.reload();
    }
  };

  useEffect(() => {
    if (connectionState.tenderlyForkRpcUrl !== '') {
      setRpcUrlInput(connectionState.tenderlyForkRpcUrl);
    }
  }, [connectionState.tenderlyForkRpcUrl]);

  return (
    <Box gap="small" pad={{ vertical: 'small' }}>
      <Text size="small" color={rpcUrlInput === '' && 'text-weak'}>
        Use Tenderly Fork
      </Text>
      <InputWrap action={() => null} round>
        <TextInput
          plain
          type="text"
          placeholder={`Tenderly Fork RPC URL`}
          value={rpcUrlInput || ''}
          onChange={(event: any) => setRpcUrlInput(event.target.value)}
          size="small"
        />
      </InputWrap>
      <GeneralButton action={handleSubmit} background="background">
        <Text size="xsmall">Use Fork</Text>
      </GeneralButton>
      <GeneralButton action={fillEther} background="background">
        <Text size="xsmall">Fill ETH</Text>
      </GeneralButton>
    </Box>
  );
};

export default TenderlyForkSetting;

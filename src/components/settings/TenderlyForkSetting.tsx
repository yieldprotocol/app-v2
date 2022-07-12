import { Box, Text } from 'grommet';
import Switch from 'react-switch';
import { useConnection } from '../../hooks/useConnection';
import useTenderly from '../../hooks/useTenderly';
import GeneralButton from '../buttons/GeneralButton';

const TenderlyForkSetting = () => {
  const { connectionState, connectionActions } = useConnection();
  const { fillEther } = useTenderly();

  return (
    <Box gap="small" pad={{ vertical: 'small' }}>
      <Box direction="row" justify="between">
        <Text size="small" color="text">
          Use Tenderly Fork
        </Text>
        <Switch
          width={55}
          checked={connectionState.useTenderlyFork}
          offColor="#BFDBFE"
          onColor="#60A5FA"
          uncheckedIcon={false}
          checkedIcon={false}
          onChange={(val: boolean) => {
            connectionActions.useTenderly(val);
            val && window.location.reload();
          }}
          handleDiameter={20}
          borderRadius={20}
        />
      </Box>
      <GeneralButton action={fillEther} background="background">
        <Text size="xsmall">Fill ETH</Text>
      </GeneralButton>
    </Box>
  );
};

export default TenderlyForkSetting;

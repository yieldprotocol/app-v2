import { Box, Text } from 'grommet';
import Switch from 'react-switch';
import { useConnection } from '../../hooks/useConnection';

const TenderlyForkSetting = () => {
  const { connectionState, connectionActions } = useConnection();

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
          onChange={(val: boolean) => connectionActions.useTenderly(val)}
          handleDiameter={20}
          borderRadius={20}
        />
      </Box>
    </Box>
  );
};

export default TenderlyForkSetting;

import { Box, Text } from 'grommet';
import { useContext } from 'react';
import Switch from 'react-switch';
import { SettingsContext } from '../../contexts/SettingsContext';
import { Settings } from '../../contexts/types/settings';
import useFork from '../../hooks/useFork';
import GeneralButton from '../buttons/GeneralButton';

const ForkedEnvSetting = () => {

  const {
    settingsState: { useForkedEnv },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  const { fillEther} = useFork(); 

  return (
    <>
    <Box gap="small" pad={{ vertical: 'small' }}>
      <Box direction="row" justify="between">
        <Text size="small" color="text">
          Use Forked Env
        </Text>
        <Switch
          width={55}
          checked={useForkedEnv}
          offColor="#BFDBFE"
          onColor="#60A5FA"
          uncheckedIcon={false}
          checkedIcon={false}
          onChange={(val: boolean) => { 
            updateSetting(Settings.USE_FORKED_ENV, val)
            window.location.reload();
          }}
          handleDiameter={20}
          borderRadius={20}
        />
      </Box>
      <GeneralButton action={fillEther} background="background">
        <Text size="xsmall">Fill ETH</Text>
      </GeneralButton>
    </Box>
    <input /> 
    </>
  );
};

export default ForkedEnvSetting;

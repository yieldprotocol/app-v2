import { Box, Text, TextInput } from 'grommet';
import { useContext } from 'react';
import Switch from 'react-switch';
import { useAccount } from 'wagmi';
import { SettingsContext } from '../../contexts/SettingsContext';
import { Settings } from '../../contexts/types/settings';
import useFork from '../../hooks/useFork';
import { clearCachedItems } from '../../utils/appUtils';
import GeneralButton from '../buttons/GeneralButton';

const SupportSettings = () => {
  const {
    settingsState: { useForkedEnv },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  const account = useAccount();
  const { fillEther } = useFork();

  const handleResetApp = () => {
    clearCachedItems([]);
    // eslint-disable-next-line no-restricted-globals
    location.reload();
  };

  return (
    <Box gap="large">
      <Box gap="medium">
        <Box direction="row" justify="between">
          <Text color="text" weight={'bolder'}>
            Use Forked Environment
          </Text>
          <Switch
            width={55}
            checked={useForkedEnv}
            offColor="#BFDBFE"
            onColor="#60A5FA"
            uncheckedIcon={false}
            checkedIcon={false}
            onChange={(val: boolean) => {
              updateSetting(Settings.USE_FORKED_ENV, val);
              window.location.reload();
            }}
            handleDiameter={20}
            borderRadius={20}
          />
        </Box>

        <Box justify="between" gap="small">
          <Text color="text" size="small">
            Parameter: Fork URL
          </Text>
          <TextInput
            placeholder="Enter amount"
            value={process.env.NEXT_PUBLIC_FORK_URL}
            onChange={(event: any) => console.log(event)}
            size="xsmall"
          />
        </Box>

        <GeneralButton action={fillEther} background="background">
          <Text size="xsmall">Action: Fill ETH on Fork</Text>
        </GeneralButton>
      </Box>

      <Box gap="medium">
        <Box direction="row" justify="between">
          <Text color="text" weight={'bolder'}>
            Mock User
          </Text>
          <Switch
            width={55}
            checked={useForkedEnv}
            offColor="#BFDBFE"
            onColor="#60A5FA"
            uncheckedIcon={false}
            checkedIcon={false}
            onChange={(val: boolean) => {
              console.log('Mocking User');
              window.location.reload();
            }}
            handleDiameter={20}
            borderRadius={20}
          />
        </Box>

        <Box justify="between" gap="small">
          <Text color="text" size="small">
            Parameter: Mock User Address
          </Text>
          <TextInput
            placeholder="Enter amount"
            value={account.address}
            onChange={(event: any) => console.log(event)}
            size="xsmall"
          />
        </Box>
      </Box>

      <Box gap="medium">
        <Text color="text" weight={'bolder'}>
            App Reset
          </Text>

        <GeneralButton action={handleResetApp} background="background">
          <Text size="xsmall">Clear Cache and Reset</Text>
        </GeneralButton>
      </Box>
    </Box>
  );
};

export default SupportSettings;

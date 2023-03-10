import { Box, Button, Text, TextInput } from 'grommet';
import { useContext, useState } from 'react';
import Switch from 'react-switch';
import { SettingsContext } from '../../contexts/SettingsContext';
import { Settings } from '../../contexts/types/settings';
import useFork from '../../hooks/useFork';
import { clearCachedItems } from '../../utils/appUtils';
import GeneralButton from '../buttons/GeneralButton';

const SupportSettings = () => {
  const {
    settingsState: { useForkedEnv, forkEnvUrl, useMockedUser, mockUserAddress },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  const { fillEther } = useFork();

  const [forkUrlInput, setForkUrlInput] = useState<string>(forkEnvUrl);

  const [mockAddressInput, setMockAddressInput] = useState<string>(mockUserAddress);

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
              setForkUrlInput(forkEnvUrl);
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
          <TextInput value={forkUrlInput} onChange={(e) => setForkUrlInput(e.target.value)} size="xsmall" />
          <GeneralButton
            action={() => forkUrlInput !== forkEnvUrl && console.log(`changing fork url to: ${forkUrlInput}`)}
            background="background"
            disabled={!useForkedEnv || forkUrlInput === forkEnvUrl}
          >
            <Button
              plain
              disabled={!useForkedEnv || forkUrlInput === forkEnvUrl}
              onClick={() => updateSetting(Settings.FORK_ENV_URL, forkUrlInput)}
            >
              <Text size="xsmall">Update URL</Text>
            </Button>
          </GeneralButton>
        </Box>

        <GeneralButton action={() => console.log('filling ether')} background="background">
          <Button plain disabled={!useForkedEnv} onClick={fillEther}>
            <Text size="xsmall">Action: Fill ETH on Fork</Text>
          </Button>
        </GeneralButton>
      </Box>

      <Box gap="medium">
        <Box direction="row" justify="between">
          <Text color="text" weight={'bolder'}>
            Mock User
          </Text>
          <Switch
            width={55}
            checked={useMockedUser}
            offColor="#BFDBFE"
            onColor="#60A5FA"
            uncheckedIcon={false}
            checkedIcon={false}
            onChange={(val: boolean) => {
              updateSetting(Settings.USE_MOCKED_USER, val);
              updateSetting(Settings.MOCK_USER_ADDRESS, mockAddressInput);
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
            value={mockAddressInput}
            onChange={(event: any) => setMockAddressInput(event.target.value)}
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

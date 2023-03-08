import { Box, Button, Text, TextInput } from 'grommet';
import { useContext, useState } from 'react';
import Switch from 'react-switch';
import { useAccount } from 'wagmi';
import { SettingsContext } from '../../contexts/SettingsContext';
import { Settings } from '../../contexts/types/settings';
import useAccountPlus from '../../hooks/useAccountPlus';
import useFork from '../../hooks/useFork';
import { clearCachedItems } from '../../utils/appUtils';
import GeneralButton from '../buttons/GeneralButton';

const SupportSettings = () => {
  const {
    settingsState: { useForkedEnv, forkEnvUrl, useMockedUser, mockUserAddress, diagnostics, forceTransactions },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  // const account = useAccountPlus();
  const { fillEther, createNewFork } = useFork();

  const [ forkUrlInput, setForkUrlInput] = useState<string>(forkEnvUrl);

  const [ mockAddressInput, setMockAddressInput] = useState<string|undefined>(mockUserAddress);

  const handleResetApp = () => {
    clearCachedItems([]);
    // eslint-disable-next-line no-restricted-globals
    location.reload();
  };

  const handleCreateFork = async () => {
    const newForkUrl =  await createNewFork()
    updateSetting(Settings.USE_FORKED_ENV, true);
    updateSetting(Settings.FORK_ENV_URL, newForkUrl);
    // eslint-disable-next-line no-restricted-globals
    window.location.reload();
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
              updateSetting(Settings.FORK_ENV_URL, forkUrlInput);
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
            value={ forkUrlInput }
            onChange={ (e: any) => setForkUrlInput(e.target.value)  }
            size="xsmall"
          />
        </Box>

        <GeneralButton action={()=>console.log('filling ether')} background="background"  >
          <Button  plain disabled={!useForkedEnv} onClick={fillEther}>
          <Text size="xsmall">Action: Fill ETH on Fork</Text>
          </Button>
        </GeneralButton>

        <GeneralButton action={()=>handleCreateFork()} background="background"  >
          <Text size="xsmall">Action: Create and Use New Fork</Text>
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
              if (mockAddressInput) {
                updateSetting(Settings.USE_MOCKED_USER, val);
                updateSetting(Settings.MOCK_USER_ADDRESS, mockAddressInput);
                window.location.reload();
              }
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

      <Box direction="row" justify="between">
          <Text color="text" weight={'bolder'}>
            Force Transactions
          </Text>
          <Switch
            width={55}
            checked={forceTransactions}
            offColor="#BFDBFE"
            onColor="#60A5FA"
            uncheckedIcon={false}
            checkedIcon={false}
            onChange={(val: boolean) => {
              updateSetting(Settings.FORCE_TRANSACTIONS, val);
            }}
            handleDiameter={20}
            borderRadius={20}
          />
        </Box>

        <Box direction="row" justify="between">
          <Text color="text" weight={'bolder'}>
            Console Log Diagnostics 
          </Text>
          <Switch
            width={55}
            checked={diagnostics}
            offColor="#BFDBFE"
            onColor="#60A5FA"
            uncheckedIcon={false}
            checkedIcon={false}
            onChange={(val: boolean) => {
              updateSetting(Settings.DIAGNOSTICS, val);
            }}
            handleDiameter={20}
            borderRadius={20}
          />
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

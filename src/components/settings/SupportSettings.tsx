import { Box, Button, Text, TextInput } from 'grommet';
import { useContext, useEffect, useState } from 'react';
import Switch from 'react-switch';
import { SettingsContext } from '../../contexts/SettingsContext';
import { Settings } from '../../contexts/types/settings';
import useFork from '../../hooks/useFork';
import { clearCachedItems } from '../../utils/appUtils';
import GeneralButton from '../buttons/GeneralButton';

const SupportSettings = () => {
  const {
    settingsState: { useForkedEnv, forkEnvUrl, useMockedUser, mockUserAddress, diagnostics, forceTransactions },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  const {address} = useAccount();

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

  const handleFillEth = async () => {
    const newForkUrl =  await fillEther()
    // eslint-disable-next-line no-restricted-globals
    window.location.reload();
  };

  const [allowSupport, setAllowSupport] = useState<boolean>(false);
  useEffect(()=>{
    const allowList = process.env.ALLOWED_SUPPORT_ADDRESSES ? process.env.ALLOWED_SUPPORT_ADDRESSES.split(','):[];    
    if (address && allowList.includes(address)) {
      setAllowSupport(true);
    } else {
      setAllowSupport(false);
    }
  },[address])

  return (
    <>
    {allowSupport ? (
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

        <GeneralButton action={()=>null} background="background"  >
          <Button  plain disabled={!useForkedEnv} onClick={()=>handleCreateFork()}>
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
          <TextInput value={mockAddressInput} onChange={(e) => setMockAddressInput(e.target.value)} size="xsmall" />
        </Box>
        <GeneralButton
          action={() =>
            mockAddressInput !== mockUserAddress && console.log(`changing mocked user to: ${mockAddressInput}`)
          }
          background="background"
          disabled={!useForkedEnv || mockAddressInput === mockUserAddress}
        >
          <Button
            plain
            disabled={!mockUserAddress || mockAddressInput === mockUserAddress}
            onClick={() => updateSetting(Settings.MOCK_USER_ADDRESS, mockAddressInput)}
          >
            <Text size="xsmall">Update User</Text>
          </Button>
        </GeneralButton>
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

      <Box gap="medium" direction='row' justify='between'>
        <Text color="text" weight={'bolder'}>
          App Reset
        </Text>
        <GeneralButton action={handleResetApp} background="background">
          <Text size="xsmall">Clear Cache and Reset</Text>
        </GeneralButton>
      </Box>

    </Box>)
    : <Box pad='small' gap='small'>
       <Text size='large'>Support Access Denied</Text> 
       <Text size='xsmall'> Please ensure you are connected with a recognised support wallet. Contact the development team if you believe you require access. </Text>
       </Box>
  }
  </>
  );
};

export default SupportSettings;

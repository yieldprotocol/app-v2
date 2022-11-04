import { useContext } from 'react';
import { Box, Text } from 'grommet';
import Switch from 'react-switch';
import { ApprovalType } from '../../types';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useAccount } from 'wagmi';
import { Settings } from '../../contexts/types/settings';

const AdvancedSetting = () => {
  const { connector } = useAccount();

  const {
    settingsState: { approvalMethod, approveMax, useTenderlyFork },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  return (
    <Box gap="small" pad={{ vertical: 'small' }}>
      <Box direction="row" justify="between">
        <Text size="small" color={connector?.name === 'MetaMask' && !useTenderlyFork ? undefined : 'text-xweak'}>
          Use Approval by Transactions
        </Text>
        <Switch
          width={55}
          checked={approvalMethod === ApprovalType.TX}
          offColor="#BFDBFE"
          onColor="#60A5FA"
          uncheckedIcon={false}
          checkedIcon={false}
          onChange={(val: boolean) =>
            val
              ? updateSetting(Settings.APPROVAL_METHOD, ApprovalType.TX)
              : updateSetting(Settings.APPROVAL_METHOD, ApprovalType.SIG)
          }
          handleDiameter={20}
          borderRadius={20}
          disabled={connector?.name === 'MetaMask' || useTenderlyFork}
        />
      </Box>

      <Box direction="row" justify="between">
        <Text size="small" color={approvalMethod === ApprovalType.TX && !useTenderlyFork ? undefined : 'text-xweak'}>
          Approve Max
        </Text>
        <Switch
          checked={approveMax}
          onChange={(val: boolean) => updateSetting(Settings.APPROVAL_MAX, val)}
          width={55}
          offColor="#BFDBFE"
          onColor="#60A5FA"
          uncheckedIcon={false}
          checkedIcon={false}
          handleDiameter={20}
          borderRadius={20}
          disabled={!(approvalMethod === ApprovalType.TX) || useTenderlyFork}
        />
      </Box>
    </Box>
  );
};

export default AdvancedSetting;

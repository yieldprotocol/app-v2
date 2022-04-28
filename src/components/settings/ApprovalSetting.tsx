import { useContext } from 'react';
import { Box, Text } from 'grommet';
import Switch from 'react-switch';
import { ApprovalType } from '../../types';
import { Settings, SettingsContext } from '../../contexts/SettingsContext';
import { ChainContext } from '../../contexts/ChainContext';

const AdvancedSetting = () => {
  const {
    chainState: {
      connection: { connectionName },
    },
  } = useContext(ChainContext);

  const {
    settingsState: { approvalMethod, approveMax },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  return (
    <Box gap="small" pad={{ vertical: 'small' }}>
      <Box direction="row" justify="between">
        <Text size="small" color={connectionName === 'metamask' ? undefined : 'text-xweak'}>
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
          disabled={connectionName !== 'metamask'}
        />
      </Box>

      <Box direction="row" justify="between">
        <Text size="small" color={approvalMethod === ApprovalType.TX ? undefined : 'text-xweak'}>
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
          disabled={!(approvalMethod === ApprovalType.TX)}
        />
      </Box>
    </Box>
  );
};

export default AdvancedSetting;

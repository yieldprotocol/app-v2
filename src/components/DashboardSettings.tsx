import { useState, useContext } from 'react';
import { Button, DropButton, Text, Box } from 'grommet';
import { FiMoreVertical } from 'react-icons/fi';
import { ActionType } from '../types';
import { Settings, SettingsContext } from '../contexts/SettingsContext';

const DashboardSettings = ({ actionType }: { actionType: string }) => {
  const {
    settingsState: { dashHideEmptyVaults },
    settingsActions: { updateSetting },
  } = useContext(SettingsContext);

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const dropContentRender = (
    <Box pad="xsmall" round="xsmall" fill background="lightBackground">
      {actionType === ActionType.BORROW && (
        <Box gap="xxsmall">
          <Button
            onClick={() => {
              updateSetting(Settings.DASH_HIDE_EMPTY_VAULTS, !dashHideEmptyVaults);
              setSettingsOpen(false);
            }}
            plain
            hoverIndicator={{ color: 'gradient-transparent' }}
          >
            <Box pad="xsmall" round="xsmall">
              <Text size="small">{dashHideEmptyVaults ? 'Show Empty Vaults' : 'Hide Empty Vaults'}</Text>
            </Box>
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <DropButton
      open={settingsOpen}
      onOpen={() => setSettingsOpen(true)}
      onClose={() => setSettingsOpen(false)}
      dropContent={dropContentRender}
      dropProps={{ align: { top: 'bottom', right: 'right' } }}
      style={{ borderRadius: '6px' }}
      hoverIndicator={{ color: 'gradient-transparent' }}
    >
      <Box align="center" pad="xsmall">
        <FiMoreVertical size="1.5rem" />
      </Box>
    </DropButton>
  );
};

export default DashboardSettings;

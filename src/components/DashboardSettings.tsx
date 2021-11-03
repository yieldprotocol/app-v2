import React, { useState, useContext } from 'react';
import { Button, DropButton, Text, Box } from 'grommet';
import { FiMoreVertical } from 'react-icons/fi';
import { UserContext } from '../contexts/UserContext';
import { ActionType, IUserContext } from '../types';

const DashboardSettings = ({ actionType }: { actionType: string }) => {
  const {
    userState: { dashSettings },
    userActions: { setDashSettings },
  } = useContext(UserContext) as IUserContext;
  const { hideEmptyVaults } = dashSettings;


  

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const dropContentRender = (
    <Box pad="xsmall" round="xsmall" fill>
      {actionType === ActionType.BORROW && (
        <Box gap="xxsmall">
          <Button
            onClick={() => {
              setDashSettings('hideEmptyVaults', !hideEmptyVaults);
              setSettingsOpen(false);
            }}
            plain
            hoverIndicator={{ color: 'tailwind-blue-50' }}
          >
            <Box pad="xsmall" round="xsmall">
              <Text size="small">{hideEmptyVaults ? 'Show Empty Vaults' : 'Hide Empty Vaults'}</Text>
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
      hoverIndicator={{ color: 'tailwind-blue-100' }}
    >
      <Box align="center" pad="xsmall">
        <FiMoreVertical size="1.5rem" />
      </Box>
    </DropButton>
  );
};

export default DashboardSettings;

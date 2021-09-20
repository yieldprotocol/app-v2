import React, { useState, useContext } from 'react';
import { Button, CheckBox, DropButton, Text, Box } from 'grommet';
import { FiMoreVertical } from 'react-icons/fi';
import { UserContext } from '../contexts/UserContext';
import { ActionType, IUserContext } from '../types';

const DashboardSettings = ({ actionType }: { actionType: string }) => {
  const {
    userState: { dashSettings },
    userActions: { setDashSettings },
  } = useContext(UserContext) as IUserContext;
  const { hideEmptyVaults, hideInactiveVaults, hideZeroLendBalances, hideZeroPoolBalances } = dashSettings;

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
          <Button
            onClick={() => {
              setDashSettings('hideInactiveVaults', !hideInactiveVaults);
              setSettingsOpen(false);
            }}
            plain
            hoverIndicator={{ color: 'tailwind-blue-50' }}
          >
            <Box pad="xsmall" round="xsmall">
              <Text size="small">{hideInactiveVaults ? 'Show Inactive Vaults' : 'Hide Inactive Vaults'}</Text>
            </Box>
          </Button>
        </Box>
      )}
      {actionType === ActionType.LEND && (
        <Box gap="small">
          <Button
            onClick={() => {
              setDashSettings('hideZeroLendBalances', !hideZeroLendBalances);
              setSettingsOpen(false);
            }}
            plain
            hoverIndicator={{ color: 'tailwind-blue-50' }}
          >
            <Box pad="xsmall" round="xsmall">
              <Text size="small">
                {hideZeroLendBalances ? 'Show Zero Balance Positions' : 'Hide Zero Balance Positions'}
              </Text>
            </Box>
          </Button>
        </Box>
      )}
      {actionType === ActionType.POOL && (
        <Box gap="small">
          <Button
            onClick={() => {
              setDashSettings('hideZeroPoolBalances', !hideZeroPoolBalances);
              setSettingsOpen(false);
            }}
            plain
            hoverIndicator={{ color: 'tailwind-blue-50' }}
          >
            <Box pad="xsmall" round="xsmall">
              <Text size="small">
                {hideZeroPoolBalances ? 'Show Zero Balance Positions' : 'Hide Zero Balance Positions'}
              </Text>
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

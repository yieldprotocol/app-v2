import React, { useState, useContext } from 'react';
import { CheckBox, DropButton, Text, Box } from 'grommet';
import { FiMoreVertical } from 'react-icons/fi';
import { UserContext } from '../contexts/UserContext';
import { ActionType, IUserContext } from '../types';
import HideBalancesSetting from './HideBalancesSetting';
import CurrencyToggle from './CurrencyToggle';

const DashboardSettings = ({ actionType }: { actionType: string }) => {
  const {
    userState: { dashSettings },
    userActions: { setDashSettings },
  } = useContext(UserContext) as IUserContext;
  const {
    hideEmptyVaults,
    hideInactiveVaults,
    hideLendPositions,
    hidePoolPositions,
    hideLendBalancesSetting,
    hidePoolBalancesSetting,
    currencySetting,
  } = dashSettings;

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const dropContentRender = (
    <Box pad="small" round="xsmall" fill>
      {actionType === ActionType.BORROW && (
        <Box gap="small">
          <Box direction="row" justify="between" gap="small" align="center">
            <Text size="xsmall">Hide Empty Vaults</Text>
            <CheckBox
              toggle
              checked={hideEmptyVaults}
              onChange={(event) => setDashSettings('hideEmptyVaults', event.target.checked)}
            />
          </Box>
          <Box direction="row" justify="between" gap="small" align="center">
            <Text size="xsmall">Hide Inactive Vaults</Text>
            <CheckBox
              toggle
              checked={hideInactiveVaults}
              onChange={(event) => setDashSettings('hideInactiveVaults', event.target.checked)}
            />
          </Box>
        </Box>
      )}
      {actionType === ActionType.LEND && (
        <Box gap="small">
          <Box direction="row" justify="between" gap="xsmall" align="center">
            <Text size="xsmall">Hide Lend Positions</Text>
            <CheckBox
              toggle
              checked={hideLendPositions}
              onChange={(event) => setDashSettings('hideLendPositions', event.target.checked)}
            />
          </Box>
          <HideBalancesSetting settingName="hideLendBalancesSetting" settingValue={hideLendBalancesSetting} />
        </Box>
      )}
      {actionType === ActionType.POOL && (
        <Box gap="small">
          <Box direction="row" justify="between" gap="small" align="center">
            <Text size="xsmall">Hide Strategy Positions</Text>
            <CheckBox
              toggle
              checked={hidePoolPositions}
              onChange={(event) => setDashSettings('hidePoolPositions', event.target.checked)}
            />
          </Box>
          <HideBalancesSetting settingName="hidePoolBalancesSetting" settingValue={hidePoolBalancesSetting} />
        </Box>
      )}
    </Box>
  );

  return (
    <Box>
      <DropButton
        open={settingsOpen}
        onOpen={() => setSettingsOpen(true)}
        onClose={() => setSettingsOpen(false)}
        dropContent={dropContentRender}
        dropProps={{ align: { top: 'bottom', right: 'right' } }}
        style={{ borderRadius: '6px' }}
      >
        <Box direction="row" gap="xsmall" round="xsmall" align="center">
          <FiMoreVertical size="1.5rem" />
        </Box>
      </DropButton>
    </Box>
  );
};

export default DashboardSettings;

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
    hideStrategyPositions,
    hideLendBalancesSetting,
    hidePoolBalancesSetting,
    currencySetting,
  } = dashSettings;

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  return (
    <Box>
      <DropButton
        open={settingsOpen}
        onOpen={() => setSettingsOpen(true)}
        onClose={() => setSettingsOpen(false)}
        dropContent={
          <Box pad="small" round="xsmall">
            {actionType === ActionType.BORROW && (
              <Box direction="row" justify="between">
                <Text size="small">Hide Empty Vaults</Text>
                <CheckBox
                  toggle
                  checked={hideEmptyVaults}
                  onChange={(event) => setDashSettings('hideEmptyVaults', event.target.checked)}
                />
              </Box>
            )}
            {actionType === (ActionType.LEND || ActionType.POOL) && <HideBalancesSetting width="30%" />}
          </Box>
        }
        dropProps={{ align: { top: 'bottom', right: 'left' } }}
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

import React, { useState, useEffect, useContext } from 'react';
import { Text, Box, ResponsiveContext, Layer, Avatar } from 'grommet';
import { FiSettings, FiMenu } from 'react-icons/fi';

import YieldBalances from './YieldBalances';

import { ChainContext } from '../contexts/ChainContext';
import { abbreviateHash } from '../utils/appUtils';
import YieldAvatar from './YieldAvatar';
import YieldSettings from './YieldSettings';

const YieldAccount = (props: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    chainState: { account, chainId },
    chainActions: { connect, disconnect },
  } = useContext(ChainContext);

  const [settingsOpen, setSettingsOpen] = useState<boolean>();

  return (
    <>
      {settingsOpen && (
        <Layer
          onClickOutside={() => setSettingsOpen(false)}
          onEsc={() => setSettingsOpen(false)}
        >
          <YieldSettings setSettingsOpen={setSettingsOpen} />
        </Layer>
      )}

      {account ? (
        <Box direction="row" fill="vertical" gap="xsmall">
          {!mobile && (
            <>
              <YieldBalances />
            </>
          )}
          <Box
            round="xsmall"
            onClick={() => setSettingsOpen(true)}
            pad="small"
            justify="center"
          >
            {mobile ? (
              <Text size="small" color="text">
                <FiSettings />
              </Text>
            ) : (
              <Box direction="row" align="center" gap="small">
                <Box>
                  <Text color="text" size="small">
                    {abbreviateHash(account)}
                  </Text>
                  <Text size="xsmall" color="text-weak">
                    o Connected
                  </Text>
                </Box>

                <Box>
                  <YieldAvatar address={account.concat('y')} size={2.5} />
                </Box>

                {/* <FiSettings /> */}
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <Box border={!mobile} onClick={() => connect()} pad="small">
          <Text size="small" color="text">
            {' '}
            {mobile ? <FiMenu /> : 'Connect Wallet'}{' '}
          </Text>
        </Box>
      )}
    </>
  );
};

export default YieldAccount;

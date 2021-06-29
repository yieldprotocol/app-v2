import { Box, Collapsible, Header, Layer, ResponsiveContext, Text } from 'grommet';
import React, { useContext, useState, useRef } from 'react';

import { FiMenu, FiToggleRight, FiToggleLeft } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import Balances from './Balances';
import YieldLogo from './logos/YieldLogo';

import YieldNavigation from './YieldNavigation';

interface IYieldHeaderProps {
  actionList: any[];
}
const YieldHeader = ({ actionList } : IYieldHeaderProps) => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const { chainState: { account, chainId }, chainActions: { connect, disconnect } } = useContext(ChainContext);
  const { txState: { txPending, signPending, processPending } } = useContext(TxContext);
  const [toggleMenu] = actionList;

  return (

    <Header
      pad="medium"
      height={mobile ? undefined : 'xsmall'}
      justify="between"
      fill="horizontal"
      style={{ position: 'fixed', top: '0px' }}
      background="background"
    >
      <YieldLogo height={mobile ? '1em' : '2em'} />

      { !mobile && <YieldNavigation /> }

      {
        account ?
          <Box direction="row" fill="vertical" gap="xsmall">
            {
                !mobile &&
                <>
                  <Balances />
                  {/* <Box pad="small">
                    <Text size="xsmall" color="green"> Connected to: {chainId} </Text>
                    <Box onClick={() => disconnect()}> <Text size="xsmall" color="text-xweak"> Disconnect </Text> </Box>
                  </Box> */}
                </>
            }
            <Box round="xsmall" border={!mobile} onClick={() => toggleMenu()} pad="small" justify="center">
              <Text size="small" color="text"> { mobile ? <FiMenu /> : 'Account and Settings'} </Text>
            </Box>
          </Box>
          :
          <Box border={!mobile} onClick={() => connect()} pad="small">
            <Text size="small" color="text"> { mobile ? <FiMenu /> : 'Connect Wallet'} </Text>
          </Box>
        }

    </Header>

  );
};

export default YieldHeader;

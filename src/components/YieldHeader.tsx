import { Box, Collapsible, Header, Layer, ResponsiveContext, Text } from 'grommet';
import React, { useContext, useState, useRef } from 'react';

import { FiMenu, FiX } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';

import YieldNavigation from './YieldNavigation';

interface IYieldHeaderProps {
  actionList: any[];
}
const YieldHeader = ({ actionList } : IYieldHeaderProps) => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const { chainState: { account }, chainActions: { connect } } = useContext(ChainContext);
  const { txState: { txPending, signPending } } = useContext(TxContext);
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
      <Box background="brand" pad={mobile ? 'xsmall' : 'small'}>
        <Text size={mobile ? 'xsmall' : undefined}> YIELD</Text>
      </Box>

      { !mobile && <YieldNavigation /> }

      { signPending && <Box>Signature required</Box>}

      { txPending && <Box>Transaction Pending</Box>}

      {
      account ?
        <Box border={!mobile} onClick={() => toggleMenu()} pad="small">
          <Text size="small" color="text"> { mobile ? <FiMenu /> : 'Account and vaults'} </Text>
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

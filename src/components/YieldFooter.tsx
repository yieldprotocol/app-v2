import React, { useContext, useState } from 'react';
import { ethers, utils } from 'ethers';

import {
  Text,
  Box,
  Button,
  ResponsiveContext,
  Footer,
  Collapsible,
} from 'grommet';
import { toast } from 'react-toastify';
import { ChainContext } from '../contexts/ChainContext';

import { useChain } from '../hooks/chainHooks';
import { Cauldron, Ladle } from '../contracts';

const YieldFooter = (props: any) => {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const { chainState, chainActions } = useContext(ChainContext);
  const { account, chainId, contractMap, seriesMap, assetMap } = chainState;

  const seriesList = Array.from(seriesMap.values()) as any;
  const assetList = Array.from(assetMap.values()) as any;

  const cauldron = contractMap.get('Cauldron') as Cauldron;
  const ladle = contractMap.get('Ladle') as Ladle;

  const [testOpen, setTestOpen] = useState<boolean>(false);

  const randVault = ethers.utils.hexlify(ethers.utils.randomBytes(12));

  return (
    <Footer pad="small">

      <Box gap="medium" fill="horizontal">

        <Box onClick={() => setTestOpen(!testOpen)} alignSelf="end">
          <Text size="xsmall"> {testOpen ? ' - test panel - ' : ' + test panel + '} </Text>
        </Box>

        <Collapsible open={testOpen}>
          <Box direction="row" gap="small">
            <Button type="button" onClick={() => chainActions.connect('injected')} label="Connect web3" />
            <Button type="button" onClick={() => chainActions.disconnect()} label="Disconnect web3" />
            <p>{account}</p>
            <Button
              primary
              // onClick={
                // () => transact(
                //   ladle,
                //   [
                //     { fn: 'build', args: [randVault, seriesList[0].id, assetList[1].id], ignore: false },
                //     { fn: 'build', args: [randVault, seriesList[1].id, assetList[2].id], ignore: false },
                //   ],
                //   'footer1',
                // )
              // }
              label="multicall"
            />
            <Button primary onClick={() => toast('Transaction complete')} label="Notify Example" />
            {/* <Button primary onClick={() => transact(ladle, [{ fn: 'build', args: [randVault, seriesList[0].id, assetList[4].id], ignore: false }], 'footer2')} label="Ladle interact" /> */}
            <Button primary onClick={() => console.log(utils.arrayify('0xf4f617882cb7'))} label="Notify Example" />
          </Box>
        </Collapsible>
      </Box>

    </Footer>
  );
};

export default YieldFooter;

import React, { useContext, useState } from 'react';
import { utils } from 'ethers';

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

  console.log(assetList);

  const cauldron = contractMap.get('Cauldron') as Cauldron;
  const ladle = contractMap.get('Ladle') as Ladle;

  const [testOpen, setTestOpen] = useState<boolean>(false);
  const { transact, multiCall } = useChain();

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
              onClick={
                () => multiCall(
                  ladle,
                  [
                    { fnName: 'build', args: ['0xf4f617882cb7f4f617882312', seriesList[0].seriesId, assetList[1].id] },
                    { fnName: 'build', args: ['0xf4f617882cb7f4f617882c45', seriesList[1].seriesId, assetList[2].id] },
                  ],
                )
              }
              label="multicall"
            />
            <Button primary onClick={() => toast('Transaction complete')} label="Notify Example" />
            <Button primary onClick={() => transact(ladle, 'build', ['0xf4f617882cb7f4f617882cb7', seriesList[0].seriesId, assetList[1].id])} label="Ladle interact" />
            <Button primary onClick={() => console.log(utils.arrayify('0xf4f617882cb7'))} label="Notify Example" />
          </Box>
        </Collapsible>
      </Box>

    </Footer>
  );
};

export default YieldFooter;

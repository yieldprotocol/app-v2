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

import { useTimeTravel } from '../hooks/timeTravel';

const YieldFooter = (props: any) => {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const { chainState, chainActions } = useContext(ChainContext);
  const { account, allbackProvider } = chainState;

  const [testOpen, setTestOpen] = useState<boolean>(false);

  const { advanceTimeAndBlock } = useTimeTravel();

  return (
    <Footer pad="small">

      <Box gap="medium" fill="horizontal">

        <Box onClick={() => setTestOpen(!testOpen)} alignSelf="end">
          <Text size="xsmall"> {testOpen ? ' - test panel - ' : ' + test panel + '} </Text>
        </Box>

        <Collapsible open={testOpen}>
          <Box direction="row" gap="small">
            <Box>
              <Button disabled={!!account} secondary type="button" onClick={() => chainActions.connect('injected')} label="Connect web3" />
              <Button disabled={!account} secondary type="button" onClick={() => chainActions.disconnect()} label="Disconnect web3" />
            </Box>

            {/* <p>Current block time: { fallbackProvider && fallbackProvider.getBlock() }</p> */}

            <Button primary onClick={() => toast('Transaction complete')} label="Notify Example" />
            {/* <Button primary onClick={() => transact(ladle, [{ fn: 'build', args: [randVault, seriesList[0].id, assetList[4].id], ignore: false }], 'footer2')} label="Ladle interact" /> */}
            <Button primary onClick={() => advanceTimeAndBlock('15780000')} label=" jump 6months" />

          </Box>
        </Collapsible>
      </Box>

    </Footer>
  );
};

export default YieldFooter;

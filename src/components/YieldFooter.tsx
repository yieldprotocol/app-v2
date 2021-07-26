import React, { useContext, useEffect, useState } from 'react';
import { ethers, utils } from 'ethers';

import { Text, Box, Button, ResponsiveContext, Footer, Collapsible, Select, Layer } from 'grommet';
import { toast } from 'react-toastify';
import { ChainContext } from '../contexts/ChainContext';

import { useTimeTravel } from '../hooks/timeTravel';
import { UserContext } from '../contexts/UserContext';
import { ApprovalType, IAsset } from '../types';

const YieldFooter = (props: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const { chainState, chainActions } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { account, fallbackProvider } = chainState;

  const [testOpen, setTestOpen] = useState<boolean>(false);
  const { advanceTimeAndBlock, takeSnapshot, revertToT0 } = useTimeTravel();

  const [timestamp, setTimestamp] = useState<number | null>(null);

  useEffect(() => {
    fallbackProvider &&
      (async () => {
        const { timestamp: ts } = await fallbackProvider.getBlock(await fallbackProvider.getBlockNumber());
        setTimestamp(ts);
      })();
  }, [fallbackProvider]);

  return (

<>
        <Box onClick={() => setTestOpen(!testOpen)} style={{ position:'absolute', bottom:0, left:0 }}>
          <Text size="xsmall"> {testOpen ? ' - test panel - ' : ' + test panel + '} </Text>
        </Box>

        {testOpen && 
        <Layer 
          onClickOutside={()=>setTestOpen(false)} 
          position='bottom'
          full='horizontal'
          
          > 

          <Box pad="small">
            <Box direction="row" gap="small" justify="between">
              <Box>
                <Button
                  disabled={!!account}
                  secondary
                  type="button"
                  onClick={() => chainActions.connect('injected')}
                  label="Connect web3"
                />
                <Button
                  disabled={!account}
                  secondary
                  type="button"
                  onClick={() => chainActions.disconnect()}
                  label="Disconnect web3"
                />
              </Box>

              <Box>
                <Text>Current blockchain date: {timestamp && new Date(timestamp * 1000).toLocaleDateString()} </Text>
                <Text>Acutal date: {new Date().toLocaleDateString()} </Text>
              </Box>

              {/* <Button primary onClick={() => toast('Transaction complete')} label="Notify Example" /> */}
              {/* <Button primary onClick={() => transact(ladle, [{ fn: 'build', args: [randVault, seriesList[0].id, assetList[4].id], ignore: false }], 'footer2')} label="Ladle interact" /> */}

              <Box>
                <Button
                  disabled={new Date(timestamp! * 1000) > new Date()}
                  secondary
                  onClick={() => takeSnapshot()}
                  label="Take Time Snapshot"
                />
                <Button
                  disabled={new Date(timestamp! * 1000) <= new Date()}
                  secondary
                  onClick={() => revertToT0()}
                  label="Revert to snapshot"
                />
              </Box>
              <Box>
                <Button primary onClick={() => advanceTimeAndBlock('8000000')} label="Jump +-3months" />
              </Box>

              <Box>
                <Button
                  onClick={() =>
                    userActions.setApprovalMethod(
                      userState.approvalMethod === ApprovalType.SIG ? ApprovalType.TX : ApprovalType.SIG
                    )
                  }
                  label="Toggle approval method"
                />
                Approval Method: {userState.approvalMethod}
              </Box>
            </Box>

            <Box direction="row" gap="xsmall">
              Select an asset to fund:
              {Array.from(userState.assetMap.values() as IAsset[]).map((x: IAsset) => (
                <Button
                  secondary
                  key={x.id}
                  label={x.symbol}
                  onClick={() => x.mintTest()}
                  color={x.symbol !== 'WETH' && x.symbol !== 'WBTC' ? 'green' : 'pink'}
                />
              ))}
            </Box>
          </Box>
          </Layer>}
    </>
  );
};

export default YieldFooter;

import React, { useContext, useState } from 'react';
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

const YieldFooter = (props: any) => {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const { state: chainState, actions } = useContext(ChainContext);
  const [testOpen, setTestOpen] = useState<boolean>(false);

  return (
    <Footer pad="small">

      <Box gap="medium" fill="horizontal">

        <Box onClick={() => setTestOpen(!testOpen)} alignSelf="end">
          <Text size="xsmall"> {testOpen ? 'test panel - ' : 'test panel + '} </Text>
        </Box>

        <Collapsible open={testOpen}>
          <Box direction="row" gap="small">
            <Button type="button" onClick={() => actions.connect('injected')} label="Connect web3" />
            <Button type="button" onClick={() => actions.disconnect()} label="Disconnect web3" />
            <p>{chainState.account}</p>
            <p>{chainState.chainId}</p>
            <Button primary onClick={() => toast('Transaction complete')} label="Notify Example" />
          </Box>
        </Collapsible>

      </Box>

    </Footer>
  );
};

export default YieldFooter;

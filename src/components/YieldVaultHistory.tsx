import React, { useContext } from 'react';
import { Box, Text } from 'grommet';
import { HistoryContext } from '../contexts/HistoryContext';
import { ISeries, IVault } from '../types';
import ListWrap from './wraps/ListWrap';

const YieldVaultHistory = ({ vault }: { vault: IVault }) => {
  const { historyState, historyActions } = useContext(HistoryContext);
  const { vaultHistory } = historyState;

  const histItems = vaultHistory.get(vault.id);

  return (
    <Box pad="small" gap="xsmall" height="150px" overflow="scroll">

      <Box direction="row" gap="small" justify="between">
        <Text size="xsmall"> Date</Text>
        <Text size="xsmall"> Collateral </Text>
        <Text size="xsmall"> Debt </Text>
      </Box>

      {histItems.map((x:any) => (
        <Box key={x.transactionHash} direction="row" gap="small" justify="between" hoverIndicator={{ background: 'red' }}>
          <Text size="xsmall"> {x.date_.toString()}</Text>
          <Text size="xsmall"> {x.ink_} </Text>
          <Text size="xsmall"> {x.art_}</Text>
        </Box>))}

    </Box>
  );
};

export default YieldVaultHistory;

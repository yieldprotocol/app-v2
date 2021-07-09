import React, { useContext } from 'react';
import { Box, Text } from 'grommet';
import { HistoryContext } from '../contexts/HistoryContext';
import { ISeries, IVault } from '../types';

const YieldHistory = ({ series, vault, view }: { series: ISeries|undefined, vault: IVault|undefined, view:'POOL'|'BORROW'|'LEND'|'ALL' }) => {
  const { historyState, historyActions } = useContext(HistoryContext);
  const { vaultHistory, tradeHistory, poolHistory } = historyState;

  const tradeItems = vault && vaultHistory.get(vault.id);
  const poolItems = vault && vaultHistory.get(vault.id);
  const vaultItems = vault && vaultHistory.get(vault.id);


  return (
    <Box pad="small" gap="xsmall" height="150px" overflow="scroll">

      <Box direction="row" gap="small" justify="between">
        <Text size="xsmall"> Date</Text>
        <Text size="xsmall"> Collateral </Text>
        <Text size="xsmall"> Debt </Text>
      </Box>

      { vaultItems && vaultItems.map((x:any) => (
        <Box key={x.transactionHash} direction="row" gap="small" justify="between" hoverIndicator={{ background: 'red' }}>
          <Text size="xsmall"> {x.date_.toString()}</Text>
          <Text size="xsmall"> {x.ink_} </Text>
          <Text size="xsmall"> {x.art_}</Text>
        </Box>))}

    </Box>
  );
};

export default YieldHistory;
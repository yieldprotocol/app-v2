import React, { useContext, useEffect } from 'react';
import { Box, Text } from 'grommet';
import { HistoryContext } from '../contexts/HistoryContext';
import { ISeries, IVault } from '../types';

interface IYieldHistory {
  seriesOrVault: IVault|ISeries;
  view: ('POOL'|'VAULT'|'TRADE')[];
 }

const YieldHistory = ({ seriesOrVault, view }: IYieldHistory) => {
  const { historyState, historyActions } = useContext(HistoryContext);
  const { vaultHistory, tradeHistory, poolHistory } = historyState;

  const isVault = seriesOrVault && seriesOrVault.id.length > 12; // is a vault or a series.

  const tradeItems = !isVault && tradeHistory.get(seriesOrVault?.id);
  const poolItems = isVault && vaultHistory.get(seriesOrVault?.id);
  const vaultItems = isVault && vaultHistory.get(seriesOrVault?.id);

  return (
    <Box pad="small" gap="xsmall" height="150px" overflow="scroll">
      <Box direction="row" gap="small" justify="between">
        <Text size="xsmall"> Date</Text>
        <Text size="xsmall"> Collateral </Text>
        <Text size="xsmall"> Debt </Text>
      </Box>

      {vaultItems &&
        vaultItems.map((x: any) => (
          <Box
            key={x.transactionHash}
            direction="row"
            gap="small"
            justify="between"
            hoverIndicator={{ background: 'red' }}
          >
            <Text size="xsmall"> {x.date_.toString()}</Text>
            <Text size="xsmall"> {x.ink_} </Text>
            <Text size="xsmall"> {x.art_}</Text>
          </Box>
        ))}
    </Box>
  );
};

export default YieldHistory;

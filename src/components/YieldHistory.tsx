import React, { useContext, useEffect, useState } from 'react';
import { Box, Text } from 'grommet';
import { HistoryContext } from '../contexts/HistoryContext';
import { IHistItemBase, ISeries, IVault } from '../types';

interface IYieldHistory {
  seriesOrVault: IVault | ISeries;
  view: ('POOL' | 'VAULT' | 'TRADE')[];
}

const YieldHistory = ({ seriesOrVault, view }: IYieldHistory) => {
  /* STATE FROM CONTEXT */
  const { historyState, historyActions } = useContext(HistoryContext);
  const { vaultHistory, tradeHistory, liquididtyHistory } = historyState;

  const isVault = seriesOrVault && seriesOrVault.id.length > 12; // is a vault or a series.

  const tradeItems = !isVault && tradeHistory.get(seriesOrVault?.id);
  const poolItems = !isVault && liquididtyHistory.get(seriesOrVault?.id);
  const vaultItems = isVault && vaultHistory.get(seriesOrVault?.id);

  /* LOCAL STATE */
  const [histList, setHistList] = useState<IHistItemBase[]>([]);

  useEffect(() => {

    const _newHist: IHistItemBase[] = []
    if ( view.includes('POOL') ) _newHist.push(...poolItems)
    if ( view.includes('VAULT') ) _newHist.push(...vaultItems)
    if ( view.includes('TRADE') ) _newHist.push(...tradeItems)
    setHistList(_newHist);

  }, [poolItems, tradeItems, vaultItems, view]);

  return (
    <Box pad="small" gap="xsmall" overflow="scroll">
      <Box direction="row" gap="small" justify="between">
        <Text size="xsmall"> Transaction </Text>
        <Text size="xsmall"> Value </Text> 
        <Text size="xsmall"> Date </Text>     
      </Box>

      {histList.map((x: any) => (
        <Box
          key={x.transactionHash}
          direction="row"
          gap="small"
          justify="between"
        >
          <Text size="xsmall"> {x.histType} </Text>
          <Text size="xsmall"> {x.ink_ || x.bases_} </Text>
          <Text size="xsmall"> {x.date_}</Text>
        </Box>
      ))}
    </Box>
  );
};

export default YieldHistory;

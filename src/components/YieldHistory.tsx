import React, { useContext, useEffect, useState } from 'react';
import { Box, Collapsible, Text } from 'grommet';
import { HistoryContext } from '../contexts/HistoryContext';
import { IBaseHistItem, ISeries, IStrategy, IVault } from '../types';
import EtherscanButton from './buttons/EtherscanButton';
import { SettingsContext } from '../contexts/SettingsContext';

interface IYieldHistory {
  seriesOrVault: IVault | ISeries | IStrategy;
  view: ('POOL' | 'VAULT' | 'TRADE')[];
}

const YieldHistory = ({ seriesOrVault, view }: IYieldHistory) => {
  /* STATE FROM CONTEXT */
  const { historyState } = useContext(HistoryContext);
  const {
    settings: { darkMode },
  } = useContext(SettingsContext);
  const { vaultHistory, tradeHistory, strategyHistory } = historyState;

  /* LOCAL STATE */
  const [histList, setHistList] = useState<IBaseHistItem[]>([]);
  const [itemOpen, setItemOpen] = useState<any>(null);

  useEffect(() => {
    // if (view.includes('POOL') && poolHistory.size) setHistList(poolHistory.get(seriesOrVault.id));
    if (view.includes('POOL') && strategyHistory.size) setHistList(strategyHistory.get(seriesOrVault.id));
    if (view.includes('VAULT') && vaultHistory.size) setHistList(vaultHistory.get(seriesOrVault.id));
    if (view.includes('TRADE') && tradeHistory.size) setHistList(tradeHistory.get(seriesOrVault.id));
  }, [strategyHistory, seriesOrVault.id, tradeHistory, vaultHistory, view]);

  return (
    <Box margin={{ top: 'medium' }} height={{ max: '200px' }} style={{ overflow: 'auto' }}>
      <Box flex={false}>
        {histList.map((x: IBaseHistItem, i: number) => {
          const key_ = i;
          return (
            <Box
              key={key_}
              gap="small"
              hoverIndicator={darkMode ? 'hover' : '#f9f9f9'}
              background={itemOpen === key_ ? '#f9f9f9' : undefined}
              onClick={itemOpen === key_ ? () => setItemOpen(null) : () => setItemOpen(key_)}
              round="xsmall"
              pad="xsmall"
            >
              <Box direction="row">
                <Box basis="25%">
                  <Text size="xsmall"> {x.date_}</Text>
                </Box>
                <Box direction="row" fill justify="between">
                  <Text size="xsmall" weight={900}>
                    {x.actionCode}
                  </Text>
                  <Text size="xsmall"> {x.primaryInfo} </Text>
                </Box>
              </Box>
              <Collapsible open={itemOpen === key_}>
                <Box direction="row" justify="between">
                  <Text size="xsmall"> {x.secondaryInfo} </Text>
                  <EtherscanButton txHash={x.transactionHash} />
                </Box>
              </Collapsible>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default YieldHistory;

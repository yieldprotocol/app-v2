import { useContext, useEffect, useState } from 'react';
import { Box, Collapsible, Text } from 'grommet';
import Skeleton from 'react-loading-skeleton';
import { HistoryContext } from '../contexts/HistoryContext';
import { IBaseHistItem, IHistoryContext, ISeries, IStrategy, IVault } from '../types';
import EtherscanButton from './buttons/EtherscanButton';
import { useColorScheme } from '../hooks/useColorScheme';
import { IVYToken } from '../hooks/entities/useVYTokens';

interface IYieldHistory {
  item: IVault | ISeries | IStrategy | IVYToken;
  view: ('STRATEGY' | 'VAULT' | 'TRADE' | 'VYTOKEN')[];
}

const YieldHistory = ({ item, view }: IYieldHistory) => {
  /* STATE FROM CONTEXT */
  const { historyState, historyActions } = useContext(HistoryContext);
  const colorScheme = useColorScheme();
  const color = colorScheme === 'dark' ? 'hoverBackground' : '#f9f9f9';

  const { vaultHistory, tradeHistory, strategyHistory, vyTokenHistory } = historyState;
  const { updateVaultHistory, updateTradeHistory, updateStrategyHistory, updateVYTokenHistory } = historyActions;

  /* LOCAL STATE */
  const [histList, setHistList] = useState<IBaseHistItem[]>([]);
  const [itemOpen, setItemOpen] = useState<any>(null);
  const [histLoading, setHistLoading] = useState<boolean>(true);

  useEffect(() => {
    if (view.includes('VAULT')) {
      vaultHistory.has(item.id)
        ? setHistList(vaultHistory.get(item.id))
        : (async () => {
            setHistLoading(true);
            await updateVaultHistory([item]);
            setHistLoading(false);
          })();
    }

    if (view.includes('STRATEGY')) {
      strategyHistory.has(item.id)
        ? setHistList(strategyHistory.get(item.id))
        : (async () => {
            setHistLoading(true);
            await updateStrategyHistory([item]);
            setHistLoading(false);
          })();
    }

    if (view.includes('TRADE')) {
      tradeHistory.has(item.id)
        ? setHistList(tradeHistory.get(item.id))
        : (async () => {
            setHistLoading(true);
            await updateTradeHistory([item]);
            setHistLoading(false);
          })();
    }
    if (view.includes('VYTOKEN')) {
      vyTokenHistory?.has(item.id)
        ? setHistList(vyTokenHistory.get(item.id)!)
        : (async () => {
            setHistLoading(true);
            await updateVYTokenHistory([item.id]);
            setHistLoading(false);
          })();
    }
  }, [
    item,
    strategyHistory,
    tradeHistory,
    updateStrategyHistory,
    updateTradeHistory,
    updateVYTokenHistory,
    updateVaultHistory,
    vaultHistory,
    view,
    vyTokenHistory,
  ]);

  return (
    <Box margin={{ top: 'medium' }} height={{ max: '200px' }} style={{ overflow: 'auto' }}>
      {histLoading && !histList.length ? (
        <Box pad="small">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </Box>
      ) : (
        <Box flex={false}>
          {histList.map((x: IBaseHistItem, i: number) => {
            const key_ = i;
            return (
              <Box
                key={key_}
                gap="small"
                hoverIndicator={color}
                background={itemOpen === key_ ? color : undefined}
                onClick={itemOpen === key_ ? () => setItemOpen(null) : () => setItemOpen(key_)}
                round="xsmall"
                pad="xsmall"
              >
                <Box direction="row">
                  <Box basis="25%">
                    <Text size="xsmall">{x.date_}</Text>
                  </Box>
                  <Box direction="row" fill justify="between">
                    <Text size="xsmall" weight={900}>
                      {x.actionCode}
                    </Text>
                    <Text size="xsmall">{x.primaryInfo}</Text>
                  </Box>
                </Box>
                <Collapsible open={itemOpen === key_}>
                  <Box direction="row" justify="between">
                    <Text size="xsmall">{x.secondaryInfo}</Text>
                    <EtherscanButton txHash={x.transactionHash} />
                  </Box>
                </Collapsible>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default YieldHistory;

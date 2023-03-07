import { useContext, useEffect, useState } from 'react';
import { Box, Collapsible, Text } from 'grommet';
import Skeleton from 'react-loading-skeleton';
import { HistoryContext } from '../contexts/HistoryContext';
import { IBaseHistItem, ISeries, IStrategy, IVault } from '../types';
import EtherscanButton from './buttons/EtherscanButton';
import { useColorScheme } from '../hooks/useColorScheme';

interface IYieldHistory {
  seriesOrVault: IVault | ISeries | IStrategy;
  view: ('STRATEGY' | 'VAULT' | 'TRADE')[];
}

const YieldHistory = ({ seriesOrVault, view }: IYieldHistory) => {
  /* STATE FROM CONTEXT */
  const { historyState, historyActions } = useContext(HistoryContext);
  const colorScheme = useColorScheme();
  const color = colorScheme === 'dark' ? 'hoverBackground' : '#f9f9f9';

  const { vaultHistory, tradeHistory, strategyHistory } = historyState;
  const { updateVaultHistory, updateTradeHistory, updateStrategyHistory } = historyActions;

  /* LOCAL STATE */
  const [histList, setHistList] = useState<IBaseHistItem[]>([]);
  const [itemOpen, setItemOpen] = useState<any>(null);
  const [histLoading, setHistLoading] = useState<boolean>(true);

  useEffect(() => {


    if (view.includes('VAULT')) {
      vaultHistory.has(seriesOrVault.id)
        ? setHistList(vaultHistory.get(seriesOrVault.id))
        : (async () => {
            setHistLoading(true);
            await updateVaultHistory([seriesOrVault]);
            setHistLoading(false);
          })();
    }

    if (view.includes('STRATEGY')) {
      strategyHistory.has(seriesOrVault.id)
        ? setHistList(strategyHistory.get(seriesOrVault.id))
        : (async () => {
            setHistLoading(true);
            await updateStrategyHistory([seriesOrVault]);
            setHistLoading(false);
          })();
    }

    if (view.includes('TRADE')) {
      tradeHistory.has(seriesOrVault.id)
        ? setHistList(tradeHistory.get(seriesOrVault.id))
        : (async () => {
            setHistLoading(true);
             await updateTradeHistory([seriesOrVault]);
            setHistLoading(false);
          })();
    }
  }, [seriesOrVault, strategyHistory, tradeHistory, vaultHistory, view]);

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
      )}
    </Box>
  );
};

export default YieldHistory;

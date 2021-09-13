import React, { useContext, useEffect, useState } from 'react';
import { Box, Collapsible, Text } from 'grommet';
import { HistoryContext } from '../contexts/HistoryContext';
import { IBaseHistItem, ISeries, IStrategy, IVault } from '../types';
import { modColor } from '../utils/appUtils';
import { UserContext } from '../contexts/UserContext';
import EtherscanButton from './buttons/EtherscanButton';

interface IYieldHistory {
  seriesOrVault: IVault | ISeries | IStrategy;
  view: ('POOL' | 'VAULT' | 'TRADE')[];
}

const YieldHistory = ({ seriesOrVault, view }: IYieldHistory) => {
  /* STATE FROM CONTEXT */
  const { historyState, historyActions } = useContext(HistoryContext);
  // const {
  //   userState: { seriesMap },
  // } = useContext(UserContext);
  const { vaultHistory, tradeHistory, strategyHistory } = historyState;

  const isVault = seriesOrVault && seriesOrVault.id.length > 12; // is a vault or a series.

  /* LOCAL STATE */
  const [histList, setHistList] = useState<IBaseHistItem[]>([]);
  const [itemOpen, setItemOpen] = useState<any>(null);

  useEffect(() => {
    // if (view.includes('POOL') && poolHistory.size) setHistList(poolHistory.get(seriesOrVault.id));
    if (view.includes('POOL') && strategyHistory.size) setHistList(strategyHistory.get(seriesOrVault.id));
    if (view.includes('VAULT') && vaultHistory.size) setHistList(vaultHistory.get(seriesOrVault.id));
    if (view.includes('TRADE') && tradeHistory.size) setHistList(tradeHistory.get(seriesOrVault.id));
  }, [isVault, strategyHistory, seriesOrVault.id, tradeHistory, vaultHistory, view]);

  return (
    <Box margin={{ top: 'medium' }} height={{ max: '200px' }} style={{ overflow: 'auto' }}>
      <Box flex={false}>
        {histList.map((x: IBaseHistItem, i: number) => {
          const key_ = i;
          return (
            <Box
              key={key_}
              gap="small"
              hoverIndicator="#f9f9f9"
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
                    {x.histType}
                  </Text>
                  {/* <Text size="xsmall"> {x.ink_ || x.bases_} </Text> */}
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

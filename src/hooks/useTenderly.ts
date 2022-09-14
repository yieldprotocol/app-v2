import { ethers } from 'ethers';
import { useCallback, useContext, useEffect, useState } from 'react';
import { ChainContext}  from '../contexts/ChainContext';

const useTenderly = () => {

  const { chainState } = useContext(ChainContext);
  const { connection  } = chainState;

  const [startBlock, setStartBlock] = useState<number>();

  const fillEther = useCallback(async () => {
    console.log( connection.account);
    try {
      const tenderlyProvider = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_JSON_RPC_URL);
      const transactionParameters = [[connection.account], ethers.utils.hexValue(BigInt('100000000000000000000'))];
      await tenderlyProvider?.send('tenderly_addBalance', transactionParameters);
    } catch (e) {
      console.log('could not fill eth on tenderly fork');
    }
  }, [connection.account]);

  useEffect(() => {
    const getStartBlock = async () => {
      try {
        const tenderlyProvider = new ethers.providers.JsonRpcProvider(process.env.TENDERLY_JSON_RPC_URL);
        const num = await tenderlyProvider.send('tenderly_getForkBlockNumber', []);
        setStartBlock(+num.toString());
      } catch (e) {
        console.log('could not get tenderly start block', e);
      }
    };

    if (connection.useTenderlyFork) getStartBlock();
    
  }, [connection.useTenderlyFork]);

  return { tenderlyStartBlock: startBlock, fillEther };
};

export default useTenderly;

import { ethers } from 'ethers';
import { InferGetStaticPropsType } from 'next';
import dynamic from 'next/dynamic';
import { SUPPORTED_RPC_URLS } from '../../config/chainData';
import { getAssets } from '../../lib/chain/assets';
import { getContracts } from '../../lib/chain/contracts';
import { getSeries } from '../../lib/chain/series';
import { getStrategies } from '../../lib/chain/strategies';
import { mapify } from '../../utils/appUtils';
import { CONTRACTS_TO_FETCH_SSR } from '../../utils/constants';

const DynamicPool = dynamic(() => import('../../components/views/Pool'), { ssr: false });

const Pool = ({ assetMap, seriesMap, strategyMap }: InferGetStaticPropsType<typeof getStaticProps>) => (
  <DynamicPool
    assetMapProps={mapify(assetMap)}
    seriesMapProps={mapify(seriesMap)}
    strategyMapProps={mapify(strategyMap)}
  />
);

export const getStaticProps = async () => {
  const chainId = 1;
  const provider = new ethers.providers.JsonRpcProvider(SUPPORTED_RPC_URLS[chainId], chainId);
  const contractMap = getContracts(provider, chainId, CONTRACTS_TO_FETCH_SSR);
  const assetMap = await getAssets(provider, contractMap);
  const seriesMap = await getSeries(provider, contractMap);
  const strategyMap = await getStrategies(provider, seriesMap);

  return { props: { assetMap, seriesMap, strategyMap } };
};

export default Pool;

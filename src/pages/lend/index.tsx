import { ethers } from 'ethers';
import { InferGetStaticPropsType } from 'next';
import dynamic from 'next/dynamic';
import { SUPPORTED_RPC_URLS } from '../../config/chainData';
import { getAssets } from '../../lib/chain/assets';
import { getContracts } from '../../lib/chain/contracts';
import { getSeries } from '../../lib/chain/series';
import { mapify } from '../../utils/appUtils';

const DynamicLend = dynamic(() => import('../../components/views/Lend'), { ssr: false });

const Lend = ({ assetMap, seriesMap }: InferGetStaticPropsType<typeof getStaticProps>) => (
  <DynamicLend assetMapProps={mapify(assetMap)} seriesMapProps={mapify(seriesMap)} />
);

export const getStaticProps = async () => {
  const chainId = 1;
  const provider = new ethers.providers.JsonRpcProvider(SUPPORTED_RPC_URLS[chainId], chainId);
  const contractMap = getContracts(provider, chainId);
  const assetMap = await getAssets(provider, contractMap);
  const seriesMap = await getSeries(provider, chainId, contractMap);

  return { props: { assetMap, seriesMap } };
};

export default Lend;

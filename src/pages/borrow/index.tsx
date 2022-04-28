import { ethers } from 'ethers';
import { InferGetStaticPropsType } from 'next';
import dynamic from 'next/dynamic';
import { SUPPORTED_RPC_URLS } from '../../config/chainData';
import { getAssets } from '../../lib/chain/assets';
import { getContracts } from '../../lib/chain/contracts';
import { getSeries } from '../../lib/chain/series';

const DynamicBorrow = dynamic(() => import('../../components/views/Borrow'), { ssr: false });

const mapify = (obj: Object) =>
  Object(obj)
    .keys()
    .reduce((map, curr) => map.set(curr, obj[curr]), new Map());

const Borrow = ({ assetMap, seriesMap }: InferGetStaticPropsType<typeof getStaticProps>) => (
  <DynamicBorrow assetMapProps={mapify(assetMap)} seriesMapProps={mapify(seriesMap)} />
);

export const getStaticProps = async () => {
  const chainId = 1;
  const provider = new ethers.providers.JsonRpcProvider(SUPPORTED_RPC_URLS[chainId], chainId);
  const contractMap = getContracts(provider, chainId);
  const assetMap = await getAssets(provider, contractMap);
  const seriesMap = await getSeries(provider, chainId, contractMap);
  return { props: { assetMap, seriesMap } };
};

export default Borrow;

import { ethers } from 'ethers';
import { InferGetStaticPropsType } from 'next';
import dynamic from 'next/dynamic';
import { SUPPORTED_RPC_URLS } from '../../config/chainData';
import { getAssets } from '../../lib/chain/assets';
import { getContracts } from '../../lib/chain/contracts';
import { getSeries } from '../../lib/chain/series';
import { mapify } from '../../utils/appUtils';
import { CONTRACTS_TO_FETCH_SSR } from '../../utils/constants';

const DynamicBorrow = dynamic(() => import('../../components/views/Borrow'), { ssr: false });

const Borrow = ({ assetMap, seriesMap }: InferGetStaticPropsType<typeof getStaticProps>) => (
  <DynamicBorrow assetMapProps={mapify(assetMap)} seriesMapProps={mapify(seriesMap)} />
);

export const getStaticProps = async () => {
  const chainId = 1;
  const provider = new ethers.providers.JsonRpcProvider(SUPPORTED_RPC_URLS[chainId], chainId);
  const contractMap = getContracts(provider, chainId, CONTRACTS_TO_FETCH_SSR);
  const assetMap = await getAssets(provider, contractMap);
  const seriesMap = await getSeries(provider, chainId, contractMap);

  return { props: { assetMap, seriesMap } };
};

export default Borrow;

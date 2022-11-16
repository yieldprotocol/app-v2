import { GetStaticProps, InferGetStaticPropsType } from 'next';
import Borrow from '../../components/views/Borrow';
import useChainId from '../../hooks/useChainId';
import { getSeriesEntitiesSSR, mapify } from '../../lib/seriesEntities';
import { ISeriesMap } from '../../types';

const BorrowPage = ({ seriesMap }: InferGetStaticPropsType<typeof getStaticProps>) => {
  const chainId = useChainId();
  return <Borrow seriesMap={mapify(seriesMap[chainId]!)} />;
};

// map chain id to ISeriesMap (mapping series id to series entity)
export const getStaticProps: GetStaticProps<{
  seriesMap: { [chainId: number]: ISeriesMap | undefined };
}> = async () => {
  const seriesMap = await getSeriesEntitiesSSR();
  return { props: { seriesMap } };
};

export default BorrowPage;

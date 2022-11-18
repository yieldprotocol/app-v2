import { GetStaticProps, InferGetStaticPropsType } from 'next';
import Dashboard from '../../components/views/Dashboard';
import useChainId from '../../hooks/useChainId';
import { getSeriesEntitiesSSR, mapify } from '../../lib/seriesEntities';
import { ISeriesMap } from '../../types';

const DashboardPage = ({ seriesMap }: InferGetStaticPropsType<typeof getStaticProps>) => {
  const chainId = useChainId();
  return <Dashboard seriesMap={mapify(seriesMap[chainId]!)} />;
};

export const getStaticProps: GetStaticProps<{
  seriesMap: { [chainId: number]: ISeriesMap | undefined };
}> = async () => {
  const seriesMap = await getSeriesEntitiesSSR();
  return { props: { seriesMap } };
};

export default DashboardPage;

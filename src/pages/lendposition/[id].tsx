import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import LendPosition from '../../components/views/LendPosition';
import { SERIES_1, SERIES_42161 } from '../../config/series';
import useChainId from '../../hooks/useChainId';
import { getSeriesEntitiesSSR, mapify } from '../../lib/seriesEntities';
import { ISeriesMap } from '../../types';

const LendPositionPage = ({ seriesMap }: InferGetStaticPropsType<typeof getStaticProps>) => {
  const chainId = useChainId();
  return <LendPosition seriesMap={mapify(seriesMap[chainId]!)} />;
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [...SERIES_1.keys(), ...SERIES_42161.keys()].map((id) => ({ params: { id } })), // get all series id's
    fallback: false,
  };
};

// map chain id to ISeriesMap (mapping series id to series entity)
export const getStaticProps: GetStaticProps<{
  seriesMap: { [chainId: number]: ISeriesMap | null };
}> = async () => {
  const seriesMap = await getSeriesEntitiesSSR();
  return { props: { seriesMap } };
};

export default LendPositionPage;

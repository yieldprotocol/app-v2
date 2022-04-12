import dynamic from 'next/dynamic';

const DynamicPoolPosition = dynamic(() => import('../../components/views/PoolPosition'), { ssr: false });

const PoolPosition = () => <DynamicPoolPosition />;

export default PoolPosition;

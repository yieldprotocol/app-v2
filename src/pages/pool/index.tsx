import dynamic from 'next/dynamic';

const DynamicPool = dynamic(() => import('../../components/views/Pool'), { ssr: false });

const Pool = () => <DynamicPool />;

export default Pool;

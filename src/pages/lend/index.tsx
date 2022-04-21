import dynamic from 'next/dynamic';

const DynamicLend = dynamic(() => import('../../components/views/Lend'), { ssr: false });

const Lend = () => <DynamicLend />;

export default Lend;

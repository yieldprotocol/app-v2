import dynamic from 'next/dynamic';

const DynamicLendPosition = dynamic(() => import('../../components/views/LendPosition'), { ssr: false });

const LendPosition = () => <DynamicLendPosition />;

export default LendPosition;

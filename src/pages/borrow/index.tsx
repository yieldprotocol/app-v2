import dynamic from 'next/dynamic';

const DynamicBorrow = dynamic(() => import('../../components/views/Borrow'), { ssr: false });

const Borrow = () => <DynamicBorrow />;

export default Borrow;

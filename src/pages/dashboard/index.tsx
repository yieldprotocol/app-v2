import dynamic from 'next/dynamic';

const DynamicDashboard = dynamic(() => import('../../components/views/Dashboard'), { ssr: false });

const Dashboard = () => <DynamicDashboard />;

export default Dashboard;

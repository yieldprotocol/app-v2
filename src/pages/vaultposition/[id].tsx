import dynamic from 'next/dynamic';

const DynamicVaultPosition = dynamic(() => import('../../components/views/VaultPosition'), { ssr: false });

const VaultPositionPage = () => <DynamicVaultPosition />;

export default VaultPositionPage;

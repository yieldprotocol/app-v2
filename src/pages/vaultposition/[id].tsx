import dynamic from 'next/dynamic';

const DynamicVaultPosition = dynamic(() => import('../../components/views/VaultPosition'), { ssr: false });

const VaultPosition = () => <DynamicVaultPosition />;

export default VaultPosition;

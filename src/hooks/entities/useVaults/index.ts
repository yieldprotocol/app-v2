import useVaultsFR from './useVaultsFR';
import useVaultsVR from './useVaultsVR';

const useVaults = () => {
  const { data: vaultsFR, isLoading: vaultsFRLoading } = useVaultsFR();
  const { data: vaultsVR, isLoading: vaultsVRLoading } = useVaultsVR();

  return {
    data: new Map([...(vaultsFR?.entries() || []), ...(vaultsVR?.entries() || [])]),
    isLoading: vaultsFRLoading || vaultsVRLoading,
    isLoadingFR: vaultsFRLoading,
    isLoadingVR: vaultsVRLoading,
  };
};
export default useVaults;

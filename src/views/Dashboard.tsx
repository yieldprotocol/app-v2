import React, { useEffect, useContext, useState, useCallback } from 'react';
import { Box, ResponsiveContext, Text } from 'grommet';
import { UserContext } from '../contexts/UserContext';
import { ChainContext } from '../contexts/ChainContext';
import Vaults from '../components/Vaults';
import { IVault, IAsset, ISeries, IUserContext } from '../types';
import YieldInfo from '../components/YieldInfo';
import MainViewWrap from '../components/wraps/MainViewWrap';
import PanelWrap from '../components/wraps/PanelWrap';

interface IVaultFilter {
  base: IAsset | undefined;
  series: ISeries | undefined;
  ilk: IAsset | undefined;
}

const Dashboard = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  /* STATE FROM CONTEXT */
  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const {
    chainState: { account },
  } = useContext(ChainContext);
  const { assetMap, vaultMap, seriesMap, selectedSeriesId, selectedBaseId, showInactiveVaults } = userState;
  const { setSelectedVault } = userActions;

  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);

  /* LOCAL STATE */
  const [showAllVaults, setShowAllVaults] = useState<boolean>(false);
  const [showVaultModal, setShowVaultModal] = useState<boolean>(false);
  const [allVaults, setAllVaults] = useState<IVault[]>([]);

  const [filter, setFilter] = useState<IVaultFilter>();
  const [filteredVaults, setFilteredVaults] = useState<IVault[]>([]);

  const handleSelect = (_vault: IVault) => {
    setSelectedVault(_vault.id);
    setShowVaultModal(true);
  };

  const handleCloseModal = () => {
    setShowVaultModal(false);
    setSelectedVault(null);
  };

  const handleFilter = useCallback(
    ({ base, series, ilk }: IVaultFilter) => {
      const _filteredVaults: IVault[] = Array.from(vaultMap.values())
        .filter((vault: IVault) => showInactiveVaults || vault.isActive)
        .filter((vault: IVault) => (base ? vault.baseId === base.id : true))
        .filter((vault: IVault) => (series ? vault.seriesId === series.id : true))
        .filter((vault: IVault) => (ilk ? vault.ilkId === ilk.id : true));

      setFilter({ base, series, ilk });
      setFilteredVaults(_filteredVaults);
    },
    [vaultMap, showInactiveVaults]
  );

  /* CHECK the list of current vaults which match the current series/ilk selection */
  useEffect(() => {
    if (!showVaultModal) {
      const _allVaults: IVault[] = Array.from(vaultMap.values()) as IVault[];
      setAllVaults(_allVaults);
      handleFilter({ base: selectedBase, series: undefined, ilk: undefined });

      // handle fitlering eventually
      // if (selectedBase) {
      //   handleFilter({ base: selectedBase, series: undefined, ilk: undefined });
      // }
      // if (selectedBase && selectedSeries) {
      //   handleFilter({ base: selectedBase, series: selectedSeries, ilk: undefined });
      // }
    }
  }, [vaultMap, selectedBase, selectedSeries, showVaultModal, handleFilter]);

  return (
    <MainViewWrap>
      {!mobile && (
        <PanelWrap align="end">
          <Text>My Dashboard</Text>
          <YieldInfo />
        </PanelWrap>
      )}
      <Box fill pad="large">
        {!account ? (
          <Text>Please connect to your account</Text>
        ) : (
          <Box width="75%" gap="small">
            <Text size="large">Vaults</Text>
            <Vaults vaults={filteredVaults} handleSelect={handleSelect} />
          </Box>
        )}
      </Box>
    </MainViewWrap>
  );
};
export default Dashboard;

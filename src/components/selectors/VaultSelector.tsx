import { Box, Layer, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { IUserContext, IVault } from '../../types';
import Vault from '../../views/Vault';
import VaultWrap from '../wraps/VaultWrap';

function VaultSelector() {
  /* STATE FROM CONTEXT */

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, vaultMap, seriesMap, selectedSeriesId, selectedIlkId, selectedBaseId } = userState;
  const { setSelectedVault } = userActions;

  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedIlk = assetMap.get(selectedIlkId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);

  const [showAllVaults, setShowAllVaults] = useState<boolean>(false);
  const [showVaultModal, setShowVaultModal] = useState<boolean>(false);

  const [allVaults, setAllVaults] = useState<IVault[]>([]);
  const [matchingBaseVaults, setMatchingBaseVaults] = useState<IVault[]>([]);
  const [matchingSeriesVaults, setMatchingSeriesVaults] = useState<IVault[]>([]);
  const [matchingIlkVaults, setMatchingIlkVaults] = useState<IVault[]>([]);

  const [filters, setFilters] = useState<string[]>([]);
  const [filteredVaults, setFilteredVaults] = useState<IVault[]>([]);

  /* CHECK the list of current vaults which match the current series/ilk selection */
  useEffect(() => {
    if (!showVaultModal) {
      const _allVaults: IVault[] = Array.from(vaultMap.values()) as IVault[];
      setAllVaults(_allVaults);

      if (selectedBase) {
        const _matchingVaults = _allVaults.filter((v:IVault) => (
          v.baseId === selectedBase.id
        ));
        setFilters([selectedBase.symbol]);
        setFilteredVaults(_matchingVaults);
      }
      if (selectedBase && selectedSeries) {
        const _matchingVaults = _allVaults.filter((v:IVault) => (
          v.baseId === selectedBase.id &&
        v.seriesId === selectedSeries.id
        ));
        setFilters([selectedBase.symbol, selectedSeries.displayNameMobile]);
        setFilteredVaults(_matchingVaults);
      }

      if (selectedBase && selectedSeries && selectedIlk) {
        const _matchingVaults = _allVaults.filter((v:IVault) => (
          v.ilkId === selectedIlk.id &&
        v.baseId === selectedBase.id &&
        v.seriesId === selectedSeries.id
        ));
        setFilters([selectedBase.symbol, selectedSeries.displayNameMobile, selectedIlk.symbol]);
        setFilteredVaults(_matchingVaults);
      }
    }
  }, [vaultMap, selectedBase, selectedIlk, selectedSeries, showVaultModal]);

  const handleSelect = (_vault:IVault) => {
    setSelectedVault(_vault.id);
    setShowVaultModal(true);
  };

  return (
    <Box gap="small" pad="small" justify="between" alignSelf="end">

      {
        showVaultModal &&
        <Layer
          onClickOutside={() => setShowVaultModal(false)}
          modal
        >
          <Vault />
        </Layer>
      }

      {
        (filteredVaults.length > 0 || showAllVaults) &&
        <Box animation="fadeIn" justify="end" align="end">
          <Text size="small" color="text-weak"> My vaults: </Text>
        </Box>
      }

      {
        !showAllVaults &&
        <Box direction="row" gap="small" justify="end">
          <Text size="xsmall">Filters:</Text>
          {filters.map((filter: string) => (
            <Box key={filter} border round pad={{ horizontal: 'xsmall' }}> <Text size="xsmall">{filter}</Text></Box>
          ))}
        </Box>
      }

      {
      (showAllVaults ? allVaults : filteredVaults).map((x:IVault, i:number) => (
        <Box
          key={x.id}
          animation={{ type: 'fadeIn', delay: i * 100, duration: 1500 }}
          hoverIndicator={{ elevation: 'large' }}
          onClick={() => handleSelect(x)}
          pad="xsmall"
          round="xsmall"
        >
          <Text weight={450} size="small"> {x.id} </Text>
        </Box>
      ))
      }

      <Box
        pad="xsmall"
        align="end"
        onClick={() => setShowAllVaults(!showAllVaults)}
      >
        <Text size="xsmall"> {showAllVaults ? 'Only show relevant vaults' : `Show all ${allVaults.length} vaults`} </Text>
      </Box>
    </Box>
  );
}

export default VaultSelector;

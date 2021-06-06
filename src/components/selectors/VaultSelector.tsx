import { Box, Layer, Text } from 'grommet';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { IAsset, ISeries, IUserContext, IVault } from '../../types';
import Vault from '../../views/Vault';
import VaultListItem from '../VaultListItem';
import ModalWrap from '../wraps/ModalWrap';

interface IVaultFilter {
  base: IAsset| undefined,
  series: ISeries | undefined,
  ilk: IAsset | undefined,
}

function VaultSelector(target:any) {
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

  const [currentFilter, setCurrentFilter] = useState<(IVaultFilter)>();
  const [filterLabels, setFilterLabels] = useState<(string|undefined)[]>([]);
  const [filteredVaults, setFilteredVaults] = useState<IVault[]>([]);

  const handleSelect = (_vault:IVault) => {
    setSelectedVault(_vault.id);
    setShowVaultModal(true);
  };

  const handleFilter = useCallback(
    ({ base, series, ilk }: IVaultFilter) => {
      const _filteredVaults: IVault[] = Array.from(vaultMap.values())
        .filter((vault:IVault) => (base ? vault.baseId === base.id : true))
        .filter((vault:IVault) => (series ? (vault.seriesId === series.id) : true))
        .filter((vault:IVault) => (ilk ? (vault.ilkId === ilk.id) : true));

      setCurrentFilter({ base, series, ilk });
      setFilterLabels([base?.symbol, series?.displayNameMobile, ilk?.symbol]);
      setFilteredVaults(_filteredVaults);
    },
    [vaultMap],
  );

  /* CHECK the list of current vaults which match the current series/ilk selection */
  useEffect(() => {
    if (!showVaultModal) {
      const _allVaults: IVault[] = Array.from(vaultMap.values()) as IVault[];
      setAllVaults(_allVaults);
      if (selectedBase) {
        handleFilter({ base: selectedBase, series: undefined, ilk: undefined });
      }
      if (selectedBase && selectedSeries) {
        handleFilter({ base: selectedBase, series: selectedSeries, ilk: undefined });
      }
    }
  }, [vaultMap, selectedBase, selectedSeries, showVaultModal, handleFilter]);

  // useEffect(() => {
  //   !currentFilter?.base &&
  //   !currentFilter?.series &&
  //   !currentFilter?.ilk &&
  //   setShowAllVaults(true);
  // }, [currentFilter]);

  return (

    <>

      <ModalWrap modalOpen={showVaultModal} toggleModalOpen={() => setShowVaultModal(!showVaultModal)}>
        <Vault />
      </ModalWrap>

      {
      allVaults.length > 0 &&
        <Box
          justify="between"
          alignSelf="end"
          gap="small"
          pad="small"
        >

          <Box animation="fadeIn" justify="end" align="end" direction="row" gap="small">
            <Text size="small" color="text-weak"> { showAllVaults ? 'All my vaults' : 'My vaults'}</Text>
          </Box>

          {
          !showAllVaults &&
          <Box>
            <Box direction="row" gap="small" justify="end" align="center">
              {
                filterLabels[0] &&
                <Box gap="xsmall" border direction="row" round pad={{ horizontal: 'xsmall', vertical: 'xsmall' }}>
                  <Text size="xsmall">{filterLabels[0]}-based</Text>
                  <Text
                    size="xsmall"
                    onClick={() => handleFilter({ ...currentFilter, base: undefined } as IVaultFilter)}
                  > x
                  </Text>
                </Box>
              }
              {
              filterLabels[1] &&
              <Box gap="xsmall" direction="row" border round pad={{ horizontal: 'xsmall', vertical: 'xsmall' }}>
                <Text size="xsmall">{filterLabels[1]}</Text>
                <Text
                  size="xsmall"
                  onClick={() => handleFilter({ ...currentFilter, series: undefined } as IVaultFilter)}
                >x
                </Text>
              </Box>
              }
            </Box>
          </Box>
      }

          <Box
            height={{ max: '300px' }}
            style={{ overflow: 'auto' }}
            pad={{ horizontal: 'small', bottom: 'small' }}
            gap="small"
            fill
          >

            {
            allVaults.length > 0 &&
            filteredVaults.length === 0 &&
            !showAllVaults &&
            <Text weight={450} size="small"> No suggested vaults </Text>
          }

            {
          (showAllVaults ? allVaults : filteredVaults).map((x:IVault, i:number) => (
            <Box
              key={x.id}
              animation={{ type: 'fadeIn', delay: i * 100, duration: 1500 }}
              hoverIndicator={{ elevation: 'large' }}
              onClick={() => handleSelect(x)}
              round="small"
              elevation="small"
            >
              <VaultListItem vault={x} />

            </Box>
          ))
          }
          </Box>

          <Box
            align="end"
            onClick={() => setShowAllVaults(!showAllVaults)}
          >
            <Text size="xsmall"> {showAllVaults ? 'Show suggested vaults only' : `Show all ${allVaults.length} vaults`} </Text>
          </Box>
        </Box>
      }
    </>
  );
}

export default VaultSelector;

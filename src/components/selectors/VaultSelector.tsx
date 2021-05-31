import { Box, Layer, Text } from 'grommet';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { IAsset, ISeries, IUserContext, IVault } from '../../types';
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

  // const [filters, setFilters] = useState<(string|undefined)[]>([]);

  const [filterLabels, setFilterLabels] = useState<(string|undefined)[]>([]);
  const [filteredVaults, setFilteredVaults] = useState<IVault[]>([]);

  const handleSelect = (_vault:IVault) => {
    setSelectedVault(_vault.id);
    setShowVaultModal(true);
  };

  const handleFilter = useCallback((
    { base, series, ilk }: { base: IAsset|undefined, series: ISeries|undefined, ilk: IAsset|undefined },
  ) => {
    const _filteredVaults: IVault[] = Array.from(vaultMap.values())
      .filter((vault:IVault) => (base ? vault.baseId === base.id : true))
      .filter((vault:IVault) => (series ? (vault.seriesId === series.id) : true))
      .filter((vault:IVault) => (ilk ? (vault.ilkId === ilk.id) : true));

    setFilterLabels([base?.symbol, series?.displayNameMobile, ilk?.symbol]);
    setFilteredVaults(_filteredVaults);
  }, [vaultMap]);

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

  return (

    <>
      {
        showVaultModal &&
        <Layer
          onClickOutside={() => setShowVaultModal(false)}
          modal
        >
          <Vault />
        </Layer>
      }

      <Box
        justify="between"
        alignSelf="end"
        gap="small"
        pad="small"
      >

        {
        allVaults.length > 0 &&
        <Box animation="fadeIn" justify="end" align="end" direction="row" gap="small">
          <Text size="small" color="text-weak"> { showAllVaults ? 'All my vaults' : 'Suggested existing vaults'}</Text>
        </Box>
        }

        {/* {
        allVaults.length === 0 &&
        <Box animation="fadeIn" justify="end" align="end">
          <Text size="small" color="text-weak"> No vaults yet</Text>
        </Box>
        } */}

        {
        !showAllVaults &&
        <Box>
          <Box direction="row" gap="small" justify="end" align="center">
            {/* <Text size="xsmall">Filters:</Text> */}
            {
          filterLabels[0] &&
          <Box gap="xsmall" border direction="row" round pad={{ horizontal: 'xsmall', vertical: 'xsmall' }}>
            <Text size="xsmall">{filterLabels[0]}-based</Text>
            <Text
              size="xsmall"
              onClick={() => handleFilter({ base: undefined, series: selectedSeries, ilk: undefined })}
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
              onClick={() => handleFilter({ base: selectedBase, series: undefined, ilk: undefined })}
            >x
            </Text>
          </Box>
          }
          </Box>
          {
          filterLabels[2] &&
          <Box direction="row" border round pad={{ horizontal: 'xsmall', vertical: 'xsmall' }}>
            <Text size="xsmall">{filterLabels[2]} collateral</Text>
            x
          </Box>
          }
        </Box>
      }

        <Box
          height={{ max: '300px' }}
          style={{ overflow: 'scroll' }}
          gap="small"
          align="end"
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
              pad="xsmall"
              round="xsmall"
            >
              <Text weight={450} size="small"> {x.id} </Text>
            </Box>
          ))
          }
        </Box>

        <Box
          pad="xsmall"
          align="end"
          onClick={() => setShowAllVaults(!showAllVaults)}
        >
          <Text size="xsmall"> {showAllVaults ? 'Show suggested vaults only' : `Show all ${allVaults.length} vaults`} </Text>
        </Box>
      </Box>
    </>
  );
}

export default VaultSelector;

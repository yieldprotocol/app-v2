import { Box, Layer, Text } from 'grommet';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { UserContext } from '../../contexts/UserContext';
import { IAsset, ISeries, IUserContext, IVault } from '../../types';
import Vault from '../../views/VaultPosition';
import VaultListItem from '../VaultListItem';
import ListWrap from '../wraps/ListWrap';
import ModalWrap from '../wraps/ModalWrap';

interface IVaultFilter {
  base: IAsset | undefined;
  series: ISeries | undefined;
  ilk: IAsset | undefined;
}

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;

  :hover {
    transform: scale(1.05);
  }
  :active {
    transform: scale(1);
  }
`;

function VaultSelector(target: any) {
  /* STATE FROM CONTEXT */
  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { assetMap, vaultMap, seriesMap, selectedSeriesId, selectedBaseId } = userState;
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

  const handleFilter = useCallback(
    ({ base, series, ilk }: IVaultFilter) => {
      const _filteredVaults: IVault[] = Array.from(vaultMap.values())
        .filter((vault: IVault) => (base ? vault.baseId === base.id : true))
        .filter((vault: IVault) => (series ? vault.seriesId === series.id : true))
        .filter((vault: IVault) => (ilk ? vault.ilkId === ilk.id : true));

      setFilter({ base, series, ilk });
      setFilteredVaults(_filteredVaults);
    },
    [vaultMap]
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

  return (
    <>
      <ModalWrap
        modalOpen={showVaultModal}
        toggleModalOpen={() => setShowVaultModal(!showVaultModal)}
        background={selectedSeries?.color}
      >
        <Vault close={() => setShowVaultModal(false)} />
      </ModalWrap>

      {allVaults.length > 0 && (
        <Box justify="between" alignSelf="end" gap="small" pad="small">
          <Box animation="fadeIn" justify="end" align="end" direction="row" gap="small">
            <Text size="small" color="text-weak">
              {' '}
              {showAllVaults ? 'All my vaults' : 'Filtered vaults'}
            </Text>
          </Box>

          <ListWrap>
            {allVaults.length > 0 && filteredVaults.length === 0 && !showAllVaults && (
              <Text weight={450} size="small">
                {' '}
                No suggested vaults{' '}
              </Text>
            )}

            {(showAllVaults ? allVaults : filteredVaults).map((x: IVault, i: number) => (
              <StyledBox
                key={x.id}
                animation={{ type: 'fadeIn', delay: i * 100, duration: 1500 }}
                hoverIndicator={{ elevation: 'large', background: 'background' }}
                onClick={() => handleSelect(x)}
                round="xsmall"
                elevation="xsmall"
                flex={false}
                fill="horizontal"
              >
                <VaultListItem vault={x} />
              </StyledBox>
            ))}
          </ListWrap>

          {!showAllVaults && (
            <Box direction="row" gap="small" justify="end" align="center">
              {filter?.base && (
                <Box
                  gap="xsmall"
                  border
                  direction="row"
                  round="xsmall"
                  pad={{ horizontal: 'xsmall', vertical: 'xsmall' }}
                  animation={{ type: 'zoomIn', duration: 1500 }}
                >
                  <Text size="xsmall">{filter.base.symbol}-based</Text>
                  <Text
                    size="xsmall"
                    onClick={() =>
                      handleFilter({
                        ...filter,
                        base: undefined,
                        series: filter.series,
                      } as IVaultFilter)
                    }
                  >
                    {' '}
                    x
                  </Text>
                </Box>
              )}

              {filter?.series && (
                <Box
                  gap="xsmall"
                  direction="row"
                  border
                  round="xsmall"
                  pad={{ horizontal: 'xsmall', vertical: 'xsmall' }}
                  animation={{ type: 'zoomIn', duration: 1500 }}
                >
                  <Text size="xsmall">{filter.series.displayNameMobile}</Text>
                  <Text size="xsmall" onClick={() => handleFilter({ ...filter, series: undefined } as IVaultFilter)}>
                    x
                  </Text>
                </Box>
              )}
            </Box>
          )}

          <Box align="end" onClick={() => setShowAllVaults(!showAllVaults)}>
            <Text size="xsmall" color="text-weak">
              {' '}
              {showAllVaults ? 'Show filtered vaults' : `Show all ${allVaults.length} vaults`}{' '}
            </Text>
          </Box>
        </Box>
      )}
    </>
  );
}

export default VaultSelector;

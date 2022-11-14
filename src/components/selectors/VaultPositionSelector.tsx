import { useCallback, useContext, useEffect, useState } from 'react';
import { Box, Button, Text } from 'grommet';
import { FiX } from 'react-icons/fi';
import { UserContext } from '../../contexts/UserContext';
import { IAsset, ISeries, IVaultRoot } from '../../types';
import VaultListItem from '../positionItems/VaultItem';
import ListWrap from '../wraps/ListWrap';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useAccount } from 'wagmi';
import useVaults from '../../hooks/useVaults';

interface IVaultFilter {
  base: IAsset | undefined;
  series: ISeries | undefined;
  ilk: IAsset | undefined;
}

function VaultPositionSelector() {
  /* STATE FROM CONTEXT */
  const {
    settingsState: { dashHideInactiveVaults },
  } = useContext(SettingsContext);
  const {
    userState: { selectedSeries, selectedBase },
  } = useContext(UserContext);
  const { data: vaults } = useVaults();

  const { isConnected } = useAccount();

  /* LOCAL STATE */
  const [showAllVaults, setShowAllVaults] = useState<boolean>(false);
  const [allVaults, setAllVaults] = useState<IVaultRoot[]>([]);

  const [filter, setFilter] = useState<IVaultFilter>();
  const [filteredVaults, setFilteredVaults] = useState<IVaultRoot[]>([]);

  const handleFilter = useCallback(
    ({ base, series, ilk }: IVaultFilter) => {
      if (!vaults) return;

      const _filteredVaults = Array.from(vaults.values())
        .filter((vault) => !dashHideInactiveVaults || vault.isActive)
        .filter((vault) => (base ? vault.baseId === base.proxyId : true))
        .filter((vault) => (series ? vault.seriesId === series.id : true))
        .filter((vault) => (ilk ? vault.ilkId === ilk.proxyId : true))
        .filter((vault) => vault.baseId !== vault.ilkId)
        .sort((vaultA, vaultB) => (vaultA.art.value.lt(vaultB.art.value) ? 1 : -1));
      setFilter({ base, series, ilk });
      setFilteredVaults(_filteredVaults);
    },
    [dashHideInactiveVaults, vaults]
  );

  /* CHECK the list of current vaults which match the current series/ilk selection */
  useEffect(() => {
    if (!vaults) return;

    const _allVaults = Array.from(vaults.values())
      // filter out vaults that have same base and ilk (borrow and pool liquidity positions)
      .filter((vault) => vault.baseId !== vault.ilkId)

      // sorting by debt balance
      .sort((vaultA, vaultB) => (vaultA.art.value.lt(vaultB.art.value) ? 1 : -1))
      // sorting to prioritize active vaults
      .sort((vaultA, vaultB) => (vaultA.isActive === vaultB.isActive ? 0 : vaultA.isActive ? -1 : 1));

    setAllVaults(_allVaults);

    if (selectedBase) {
      handleFilter({ base: selectedBase, series: undefined, ilk: undefined });
    }
    if (selectedBase && selectedSeries) {
      handleFilter({ base: selectedBase, series: selectedSeries, ilk: undefined });
    }
  }, [handleFilter, selectedBase, selectedSeries, vaults]);

  useEffect(() => {
    allVaults.length <= 5 && setShowAllVaults(true);
  }, [allVaults]);

  return (
    <>
      {isConnected && (
        <Box justify="end" fill>
          {isConnected && allVaults.length > 0 && (
            <Box gap="small">
              <Box
                animation="fadeIn"
                justify="between"
                direction="row"
                gap="small"
                pad={{ horizontal: 'medium', vertical: 'xsmall' }}
              >
                <Text size="small" color="text-weak" textAlign="center">
                  {showAllVaults ? 'My Vaults' : 'Filtered vaults '}
                </Text>
              </Box>

              <ListWrap overflow="auto">
                {allVaults.length > 0 && filteredVaults.length === 0 && !showAllVaults && (
                  <Text weight={450} size="small">
                    No suggested vaults
                  </Text>
                )}

                {(showAllVaults ? allVaults : filteredVaults).map((x, i) => (
                  <VaultListItem id={x.id} index={i} key={x.id} />
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
                      <Text size="xsmall">{filter.base.displaySymbol}-based</Text>
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
                        <Button plain icon={<FiX style={{ verticalAlign: 'middle' }} />} />
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
                      <Text
                        size="xsmall"
                        onClick={() => handleFilter({ ...filter, series: undefined } as IVaultFilter)}
                      >
                        <Button plain icon={<FiX style={{ verticalAlign: 'middle' }} />} />
                      </Text>
                    </Box>
                  )}
                </Box>
              )}

              {allVaults.length > 5 && (
                <Box align="end" onClick={() => setShowAllVaults(!showAllVaults)}>
                  <Text size="xsmall" color="text-xweak">
                    {showAllVaults ? 'Auto-filter vaults' : `Show all ${allVaults.length} vaults`}
                  </Text>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </>
  );
}

export default VaultPositionSelector;

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Box, Button, Text } from 'grommet';
import { FiX } from 'react-icons/fi';
import { RiDashboard2Line } from 'react-icons/ri';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import { IAsset, ISeries, IUserContext, IVault } from '../../types';
import VaultListItem from '../positionItems/VaultItem';
import ListWrap from '../wraps/ListWrap';
import DashButton from '../buttons/DashButton';

interface IVaultFilter {
  base: IAsset | undefined;
  series: ISeries | undefined;
  ilk: IAsset | undefined;
}

function VaultPositionSelector(target: any) {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const {
    chainState: { account },
  } = useContext(ChainContext);
  const { activeAccount, assetMap, vaultMap, seriesMap, selectedSeriesId, selectedBaseId, showInactiveVaults } =
    userState;

  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);

  /* LOCAL STATE */
  const [showAllVaults, setShowAllVaults] = useState<boolean>(false);
  const [allVaults, setAllVaults] = useState<IVault[]>([]);

  const [filter, setFilter] = useState<IVaultFilter>();
  const [filteredVaults, setFilteredVaults] = useState<IVault[]>([]);

  const handleFilter = useCallback(
    ({ base, series, ilk }: IVaultFilter) => {
      const _filteredVaults: IVault[] = Array.from(vaultMap.values())
        .filter((vault: IVault) => showInactiveVaults || vault.isActive)
        .filter((vault: IVault) => (base ? vault.baseId === base.id : true))
        .filter((vault: IVault) => (series ? vault.seriesId === series.id : true))
        .filter((vault: IVault) => (ilk ? vault.ilkId === ilk.id : true))
        .sort((vaultA: IVault, vaultB: IVault) => (vaultA.art.lt(vaultB.art) ? 1 : -1));
      setFilter({ base, series, ilk });
      setFilteredVaults(_filteredVaults);
    },
    [vaultMap, showInactiveVaults]
  );

  /* CHECK the list of current vaults which match the current series/ilk selection */
  useEffect(() => {
    const _allVaults: IVault[] = (Array.from(vaultMap.values()) as IVault[])
      // sorting by debt balance
      .sort((vaultA: IVault, vaultB: IVault) => (vaultA.art.lt(vaultB.art) ? 1 : -1))
      // sorting to prioritize active vaults
      // eslint-disable-next-line no-nested-ternary
      .sort((vaultA: IVault, vaultB: IVault) => (vaultA.isActive === vaultB.isActive ? 0 : vaultA.isActive ? -1 : 1));
    setAllVaults(_allVaults);
    if (selectedBase) {
      handleFilter({ base: selectedBase, series: undefined, ilk: undefined });
    }
    if (selectedBase && selectedSeries) {
      handleFilter({ base: selectedBase, series: selectedSeries, ilk: undefined });
    }
  }, [vaultMap, selectedBase, selectedSeries, handleFilter]);

  useEffect(() => {
    allVaults.length <= 5 && setShowAllVaults(true);
  }, [allVaults]);

  return (
    account && (
      <Box justify="end" fill>
        {activeAccount && allVaults.length > 0 && (
          <Box justify="between" alignSelf="end" gap="small" pad="small" background="hover" round="xsmall">
            <Box
              animation="fadeIn"
              justify="between"
              direction="row"
              gap="small"
              pad={{ horizontal: 'medium', vertical: 'xsmall' }}
            >
              <Text size="small" color="text-weak" textAlign="center">
                {showAllVaults ? 'All vaults' : 'Filtered vaults '}
              </Text>
              <Text color="text-weak" textAlign="center">
                <DashButton />
              </Text>
            </Box>

            <ListWrap overflow="auto">
              {allVaults.length > 0 && filteredVaults.length === 0 && !showAllVaults && (
                <Text weight={450} size="small">
                  No suggested vaults
                </Text>
              )}

              {(showAllVaults ? allVaults : filteredVaults).map((x: IVault, i: number) => (
                <VaultListItem vault={x} index={i} key={x.id} />
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
                    <Text size="xsmall" onClick={() => handleFilter({ ...filter, series: undefined } as IVaultFilter)}>
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
    )
  );
}

export default VaultPositionSelector;

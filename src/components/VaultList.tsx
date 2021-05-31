import { Box, Text } from 'grommet';
import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../contexts/UserContext';
import { IUserContext, IVault } from '../types';
import VaultWrap from './wraps/VaultWrap';

function VaultList() {
  /* STATE FROM CONTEXT */

  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, vaultMap, seriesMap, selectedSeriesId, selectedIlkId, selectedBaseId } = userState;

  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedIlk = assetMap.get(selectedIlkId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);

  const [allVaults, setAllVaults] = useState<IVault[]>([]);
  const [matchingBaseVaults, setMatchingBaseVaults] = useState<IVault[]>([]);
  const [matchingIlkVaults, setMatchingIlkVaults] = useState<IVault[]>([]);

  /* CHECK the list of current vaults which match the current series/ilk selection */
  useEffect(() => {
    const _allVaults: IVault[] = Array.from(vaultMap.values()) as IVault[];
    setAllVaults(_allVaults);

    if (selectedBase && selectedSeries) {
      const _matchingVaults = _allVaults.filter((v:IVault) => (
        v.baseId === selectedBase.id &&
        v.seriesId === selectedSeries.id
      ));
      setMatchingBaseVaults(_matchingVaults);
    }
    if (selectedBase && selectedSeries && selectedIlk) {
      const _matchingVaults = _allVaults.filter((v:IVault) => (
        v.ilkId === selectedIlk.id &&
        v.baseId === selectedBase.id &&
        v.seriesId === selectedSeries.id
      ));
      setMatchingIlkVaults(_matchingVaults);
    }
  }, [vaultMap, selectedBase, selectedIlk, selectedSeries]);

  return (
    <Box gap="small" pad="small" justify="between">
      {
        matchingBaseVaults.length > 0 &&
        <Box animation="fadeIn" justify="end">
          <Text size="small" color="text-weak"> {selectedBase?.symbol}-based vaults for {selectedSeries?.displayName}: </Text>
        </Box>
        }
      {
      matchingBaseVaults.map((x:IVault, i:number) => (
        <VaultWrap key={x.id} vault={x} index={i} />
      ))
        }

      <Box
        pad="xsmall"
        align="end"
      >
        <Text size="xsmall"> show all vaults </Text>
      </Box>
    </Box>
  );
}

export default VaultList;

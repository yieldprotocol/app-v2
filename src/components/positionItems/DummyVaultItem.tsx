import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { ethers } from 'ethers';

import { Box, Text } from 'grommet';
import { ActionType, ISeries, IUserContext, IVault } from '../../types';
import { UserContext } from '../../contexts/UserContext';

import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';
import { abbreviateHash } from '../../utils/appUtils';

function DummyVaultItem({
  series,
  vaultId,
  index = 0,
  condensed,
}: {
  series: ISeries;
  vaultId: string;
  index?: number;
  condensed?: boolean;
}) {
  const history = useHistory();

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { selectedSeries, selectedBase, selectedIlk } = userState;
  const { setSelectedVault } = userActions;

  const handleSelect = (_vaultId: string) => {
    const dummyVault: IVault = {
      id: _vaultId,
      seriesId: selectedSeries?.id!,
      baseId: selectedBase?.id!,
      ilkId: selectedIlk?.id!,
      displayName: '',
      decimals: selectedBase?.decimals!,
      owner: '',
      isWitchOwner: false,
      isActive: true,
      ink: ethers.BigNumber.from(0),
      art: ethers.BigNumber.from(0),
      ink_: '',
      art_: '',
      minDebt: ethers.BigNumber.from(0),
      maxDebt: ethers.BigNumber.from(0),
      minRatio: 1.5,
    };
    // setSelectedVault(dummyVault);
    history.push(`/vaultposition/${_vaultId}`);
  };

  return (
    <ItemWrap action={() => handleSelect(vaultId)} index={index}>
      <Box direction="row" gap="small" align="center" pad="small" height={condensed ? '3rem' : undefined}>
        <PositionAvatar position={series} condensed={condensed} actionType={ActionType.LEND} />
        <Box
          fill={condensed ? 'horizontal' : undefined}
          justify={condensed ? 'between' : undefined}
          direction={condensed ? 'row' : undefined}
          align={condensed ? 'center' : undefined}
        >
          <Text weight={900} size="small" color="text-xweak">
            {abbreviateHash(vaultId, 3)}
          </Text>
          <Box direction="column">
            <Text weight={450} size="xsmall">
              {series.displayName}
            </Text>
          </Box>
        </Box>
      </Box>
    </ItemWrap>
  );
}

DummyVaultItem.defaultProps = { condensed: false, index: 0 };

export default DummyVaultItem;

import React, { useState } from 'react';
import { Box, Select, Text } from 'grommet';
import { IVault } from '../../types';
import PositionAvatar from '../PositionAvatar';

interface IVaultDropSelectorProps {
  vaults: IVault[];
  handleSelect: any;
  itemSelected: any;
  selectedIlk: any;
  displayName: string;
  placeholder: string;
}

function VaultDropSelector({
  vaults,
  handleSelect,
  itemSelected,
  selectedIlk,
  displayName,
  placeholder,
}: IVaultDropSelectorProps) {
  return (
    <Box round="xsmall" gap="small" justify="between" elevation="xsmall">
      <Select
        plain
        dropProps={{ round: 'xsmall' }}
        disabled={vaults.length < 1}
        options={[...vaults]}
        labelKey={(x: IVault) => x.displayName}
        placeholder={placeholder}
        value={itemSelected || { displayName }}
        onChange={({ option }) => handleSelect(option)}
        valueLabel={
          itemSelected?.id ? (
            <Box pad="small" direction="row" gap="medium" align="center">
              <PositionAvatar position={itemSelected} condensed />
              <Text>{itemSelected?.displayName}</Text>
            </Box>
          ) : (
            <Box pad="small">
              <Text color="text-xweak" size="small">
                {displayName}
              </Text>
            </Box>
          )
        }
        // eslint-disable-next-line react/no-children-prop
        children={(x: IVault) => (
          <>
            {x.id ? (
              <Box pad="xsmall" direction="row" gap="small" align="center">
                <PositionAvatar position={x} condensed />
                <Box>
                  <Text size="small" weight={700}>
                    {x.displayName}
                  </Text>
                  <Box direction="row" gap="small">
                    <Text size="xsmall"> {x.art_} Debt</Text>
                    <Text size="xsmall">
                      {x.ink_} {selectedIlk?.symbol} posted
                    </Text>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box pad="small" direction="row" gap="small" align="center">
                <Text color="text-weak" size="small">
                  {x.displayName}
                </Text>
              </Box>
            )}
          </>
        )}
      />
    </Box>
  );
}
export default VaultDropSelector;

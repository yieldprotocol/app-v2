import React, { useContext } from 'react';
import { Box, ResponsiveContext, Select, Text } from 'grommet';
import { FiPlusCircle } from 'react-icons/fi';
import { ActionType, IVault } from '../../types';
import PositionAvatar from '../PositionAvatar';
import { UserContext } from '../../contexts/UserContext';

interface IVaultDropSelectorProps {
  vaults: IVault[];
  handleSelect: any;
  itemSelected: any;
  displayName: string;
  placeholder: string;
  defaultOptionValue?: string | undefined;
}

function VaultDropSelector({
  vaults,
  handleSelect,
  itemSelected,
  displayName,
  placeholder,
  defaultOptionValue,
}: IVaultDropSelectorProps) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    userState: { selectedIlk },
  } = useContext(UserContext);

  return (
    <Box elevation="xsmall" background="hoverBackground" round>
      <Select
        defaultValue={undefined}
        plain
        dropProps={{ round: 'small' }}
        dropAlign={{ bottom: 'top' }}
        dropHeight="300px"
        disabled={vaults.length < 1}
        options={defaultOptionValue ? [{ displayName }, ...vaults] : [...vaults]}
        labelKey={(x: IVault) => x.displayName}
        placeholder={placeholder}
        value={itemSelected}
        onChange={({ option }) => handleSelect(option)}
        valueLabel={
          itemSelected?.id ? (
            <Box pad={mobile ? 'medium' : 'small'} direction="row" gap="medium" align="center">
              <PositionAvatar position={itemSelected} condensed actionType={ActionType.BORROW} />
              <Text>{itemSelected?.displayName}</Text>
            </Box>
          ) : (
            <Box pad={mobile ? 'medium' : 'small'} direction="row" gap="medium" align="center">
              <FiPlusCircle color="lightgrey" />
              <Text color={itemSelected?.displayName ? 'text-weak' : 'text-xweak'} size="medium">
                {displayName}
              </Text>
            </Box>
          )
        }
        // eslint-disable-next-line react/no-children-prop
        children={(x: IVault) => (
          <>
            {x.id ? (
              <Box pad="small" direction="row" gap="small" align="center" background="">
                <PositionAvatar position={x} condensed actionType={ActionType.BORROW} />
                <Box>
                  <Text size="small" weight={700}>
                    {x.displayName}
                  </Text>
                  <Box direction="row" gap="small">
                    <Text size="xsmall"> {x.art_} Debt</Text>
                    <Text size="xsmall">
                      {x.ink_} {selectedIlk?.displaySymbol} posted
                    </Text>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box pad="small" direction="row" gap="small" align="center" background="">
                <FiPlusCircle color="lightgrey" />
                <Text color="text-weak" size="medium">
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

VaultDropSelector.defaultProps = { defaultOptionValue: undefined };
export default VaultDropSelector;

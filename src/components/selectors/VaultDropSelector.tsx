import { useContext } from 'react';
import { Box, ResponsiveContext, Select, Text } from 'grommet';
import { FiChevronDown, FiPlusCircle } from 'react-icons/fi';
import { ActionType, IVault } from '../../types';
import PositionAvatar from '../PositionAvatar';
import { UserContext } from '../../contexts/UserContext';
import { useColorScheme } from '../../hooks/useColorScheme';

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
  const {
    userState: { selectedIlk },
  } = useContext(UserContext);
  const colorScheme = useColorScheme();

  return (
    <Box elevation="xsmall" background="hoverBackground" round="xlarge">
      <Select
        defaultValue={undefined}
        plain
        size="small"
        dropProps={{ round: 'small' }}
        dropAlign={{ bottom: 'top' }}
        dropHeight="300px"
        disabled={vaults.length < 1}
        options={defaultOptionValue ? [{ displayName }, ...vaults] : [...vaults]}
        labelKey={(x: IVault) => x.displayName}
        placeholder={placeholder}
        icon={<FiChevronDown />}
        value={itemSelected}
        onChange={({ option }) => handleSelect(option)}
        valueLabel={
          <Box pad="small" direction="row" gap="medium" align="center" round="xlarge" height="3rem">
            {itemSelected?.id ? (
              <PositionAvatar position={itemSelected} condensed actionType={ActionType.BORROW} />
            ) : (
              <FiPlusCircle color={colorScheme === 'dark' ? 'lightGrey' : '#555555'} />
            )}
            <Text color="text" size="xsmall">
              {itemSelected?.displayName || displayName}
            </Text>
          </Box>
        }
        // eslint-disable-next-line react/no-children-prop
        children={(x: IVault) => (
          <>
            {x.id ? (
              <Box pad="small" direction="row" gap="small" align="center">
                <PositionAvatar position={x} condensed actionType={ActionType.BORROW} />
                <Box>
                  <Text size="xsmall">{x.displayName}</Text>
                  <Box direction="row" gap="small">
                    <Text size="xsmall" weight="lighter">
                      {x.art_} Debt
                    </Text>
                    <Text size="xsmall" weight="lighter">
                      {x.ink_} {selectedIlk?.displaySymbol} posted
                    </Text>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box pad="medium" direction="row" gap="small" align="center">
                <FiPlusCircle color={colorScheme === 'dark' ? 'lightGrey' : '#555555'} />
                <Text color="text" size="xsmall">
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

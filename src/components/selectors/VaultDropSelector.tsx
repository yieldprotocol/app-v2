import { useContext } from 'react';
import { Box, ResponsiveContext, Select, Text } from 'grommet';
import { FiChevronDown, FiPlusCircle } from 'react-icons/fi';
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
              <FiPlusCircle color="lightgrey" />
            )}
            <Text color={itemSelected?.displayName ? 'text-weak' : 'text-xweak'} size="xsmall">
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
                      {x.art.formatted} Debt
                    </Text>
                    <Text size="xsmall" weight="lighter">
                      {x.ink.formatted} {selectedIlk?.displaySymbol} posted
                    </Text>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box pad="medium" direction="row" gap="small" align="center">
                <FiPlusCircle color="lightgrey" />
                <Text color="text-weak" size="xsmall">
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

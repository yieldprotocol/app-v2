import { useRouter } from 'next/router';
import { Box, Text } from 'grommet';
import { ActionType, ISeries } from '../../types';
import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';
import { abbreviateHash } from '../../utils/appUtils';

function DummyVaultItem({
  series,
  vaultId,
  index = 0,
  condensed,
}: {
  series: ISeries | undefined;
  vaultId: string;
  index?: number;
  condensed?: boolean;
}) {
  const router = useRouter();

  const handleSelect = (_vaultId: string) => {
    // setSelectedVault(dummyVault);
    router.push(`/vaultposition/${_vaultId}`);
  };

  return (
    <ItemWrap action={() => handleSelect(vaultId)} index={index}>
      <Box direction="row" gap="small" align="center" pad="small" height={condensed ? '3rem' : undefined}>
        <PositionAvatar position={series!} condensed={condensed} actionType={ActionType.LEND} />
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
              {series?.displayName}
            </Text>
          </Box>
        </Box>
      </Box>
    </ItemWrap>
  );
}

DummyVaultItem.defaultProps = { condensed: false, index: 0 };

export default DummyVaultItem;

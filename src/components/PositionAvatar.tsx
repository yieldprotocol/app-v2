import { Avatar, Box } from 'grommet';
import { FiClock } from 'react-icons/fi';
import { MdAutorenew } from 'react-icons/md';
import styled from 'styled-components';
import { IVault, ISeries, IStrategy, ActionType } from '../types';
import Logo from './logos/Logo';
import useAsset from '../hooks/useAsset';
import useSeriesEntity from '../hooks/useSeriesEntity';
import useTimeTillMaturity from '../hooks/useTimeTillMaturity';

const Outer = styled(Box)`
  position: relative;
  z-index: 0;
  width: ${(props) => props.width ?? undefined};
  min-width: ${(props) => (props.width ? `unset` : undefined)};
`;

const Inner = styled(Box)`
  position: absolute;
  z-index: 10;
  top: -2px;
  right: -2px;
`;

const Stack = styled(Box)`
  position: absolute;
  z-index: 20;
`;

function PositionAvatar({
  position,
  condensed,
  actionType,
}: {
  position: IVault | ISeries | IStrategy | null;
  actionType: ActionType;
  condensed?: boolean;
}) {
  const isVault = position?.id.length! > 15;
  const vault = isVault ? (position as IVault) : undefined;

  const { isMature } = useTimeTillMaturity();
  const { data: base } = useAsset(position?.baseId);
  const { data: ilk } = useAsset(vault?.ilkId!);
  const { data: seriesEntity } = useSeriesEntity(vault?.seriesId!);
  const series = vault ? seriesEntity : (position as ISeries);

  const baseImageSize = condensed ? '20px' : '24px';
  const ilkImageSize = condensed ? '16px' : '20px';

  const ilkBorderSize = condensed ? '18px' : '22px';

  return (
    <Outer width={condensed ? '36px' : 'auto'}>
      <Avatar
        background={isMature(series?.maturity!) ? 'lightGrey' : series?.color}
        size={condensed ? '36px' : undefined}
      >
        <Box round="large" background="white" pad="xxsmall">
          <Logo image={base?.image} height={baseImageSize} width={baseImageSize} />
        </Box>
        <Inner>
          {actionType === ActionType.BORROW && (
            <Avatar background="lightBackground" size={ilkBorderSize}>
              <Stack>
                <Logo image={ilk?.image} height={ilkImageSize} width={ilkImageSize} />
              </Stack>
            </Avatar>
          )}
          {actionType === ActionType.POOL && (
            <Avatar background="lightBackground" size={ilkBorderSize}>
              {isMature(series?.maturity!) ? <FiClock /> : <MdAutorenew />}
            </Avatar>
          )}
        </Inner>
      </Avatar>
    </Outer>
  );
}

PositionAvatar.defaultProps = { condensed: false };

export default PositionAvatar;

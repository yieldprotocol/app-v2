import { useRouter } from 'next/router';
import { useContext } from 'react';
import { Box, Text } from 'grommet';
import { ActionType } from '../../types';
import { UserContext } from '../../contexts/UserContext';
import { cleanValue } from '../../utils/appUtils';
import PositionAvatar from '../PositionAvatar';
import ItemWrap from '../wraps/ItemWrap';
import SkeletonWrap from '../wraps/SkeletonWrap';
import useAnalytics from '../../hooks/useAnalytics';
import { GA_Event, GA_Properties } from '../../types/analytics';
import { IPosition } from '../selectors/LendPositionSelector';
import useVYTokens from '../../hooks/entities/useVYTokens';
import { useLendHelpersFR } from '../../hooks/viewHelperHooks/useLendHelpers/useLendHelpersFR';
import useVYTokenBaseVal from '../../hooks/entities/useVYTokenBaseVal';

interface LendItemProps {
  item: IPosition;
  index: number;
  condensed?: boolean;
}

function LendItem({ item, index, condensed }: LendItemProps) {
  const router = useRouter();
  const { logAnalyticsEvent } = useAnalytics();

  const {
    userState: { assetMap, seriesLoading, selectedSeries, seriesMap },
    userActions: { setSelectedBase, setSelectedSeries },
  } = useContext(UserContext);
  const { data: vyTokens } = useVYTokens();
  // use vyToken balance if not a series
  const vyToken = vyTokens?.get(item.address);
  const series = [...seriesMap.values()].find((s) => s.address === item.address);
  const base = assetMap.get(item.baseId);
  const { fyTokenMarketValue } = useLendHelpersFR(series!, '0');
  const { data: vyTokenBaseVal } = useVYTokenBaseVal(item.address);

  const handleSelect = () => {
    base && setSelectedBase(base);
    series && setSelectedSeries(series);
    router.push(`/lendposition/${item.address}`);
    logAnalyticsEvent(GA_Event.position_opened, {
      id: selectedSeries?.name,
    } as GA_Properties.position_opened);
  };

  return (
    <ItemWrap action={handleSelect} index={index}>
      <Box direction="row" gap="small" align="center" pad="small" height={condensed ? '3rem' : undefined}>
        <PositionAvatar position={series ?? vyToken} condensed={condensed} actionType={ActionType.LEND} />
        <Box
          fill={condensed ? 'horizontal' : undefined}
          justify={condensed ? 'between' : undefined}
          direction={condensed ? 'row' : undefined}
          width={condensed ? '6rem' : undefined}
        >
          <Text weight={900} size="small">
            {item.displayName}
          </Text>
          <Box direction="row" gap="xsmall">
            {fyTokenMarketValue !== 'Low liquidity' && (
              <Box direction="row" gap="xsmall">
                <Text weight={450} size="xsmall">
                  Balance:
                </Text>
                <Text weight={450} size="xsmall">
                  {seriesLoading && series ? (
                    <SkeletonWrap width={30} />
                  ) : (
                    series && cleanValue(fyTokenMarketValue, base?.digitFormat!)
                  )}
                  {!vyTokenBaseVal && vyToken ? (
                    <SkeletonWrap width={30} />
                  ) : (
                    vyToken && cleanValue(vyTokenBaseVal, base?.digitFormat!)
                  )}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </ItemWrap>
  );
}

LendItem.defaultProps = { condensed: false };

export default LendItem;

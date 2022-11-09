import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { Box, Text } from 'grommet';

import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { WETH } from '../config/assets';
import Skeleton from './wraps/SkeletonWrap';
import Logo from './logos/Logo';
import { useAccount } from 'wagmi';
import { cleanValue } from '../utils/appUtils';
import useAsset from '../hooks/useAsset';

const StyledText = styled(Text)`
  svg,
  span {
    vertical-align: middle;
  }
`;

const Balance = ({ image, balance, loading }: { image: any; balance: string; loading: boolean }) => (
  <Box direction="row" gap="small" align="center">
    <StyledText size="small" color="text">
      {loading ? <Skeleton circle height={20} width={20} /> : <Logo image={image} height="20px" width="20px" />}
    </StyledText>
    <StyledText size="small" color="text">
      {loading && <Skeleton width={40} />}
      {!loading && balance}
    </StyledText>
  </Box>
);

const YieldBalances = () => {
  const {
    userState: { selectedBase, selectedIlk },
  } = useContext(UserContext);

  const { address: account } = useAccount();
  const { data: base, isLoading: baseLoading } = useAsset(selectedBase?.id!);
  const { data: ilk, isLoading: ilkLoading } = useAsset(selectedIlk?.id!);

  const { pathname } = useRouter();
  const [path, setPath] = useState<string>();

  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    pathname && setPath(pathname.split('/')[1]);
  }, [pathname]);

  return (
    <>
      {account && (
        <Box pad="small" justify="center" align="start" gap="xsmall">
          {selectedBase?.proxyId !== WETH && (
            <Balance
              image={selectedBase?.image}
              balance={cleanValue(base?.balance.formatted, 2)}
              loading={baseLoading}
            />
          )}
          {path === 'borrow' && selectedIlk?.proxyId !== WETH && selectedBase?.id !== selectedIlk?.id && (
            <Balance image={selectedIlk?.image} balance={cleanValue(ilk?.balance.formatted, 2)} loading={ilkLoading} />
          )}
        </Box>
      )}
    </>
  );
};

export default YieldBalances;

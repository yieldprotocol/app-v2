import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { Box, Text } from 'grommet';

import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { WETH } from '../config/assets';
import Skeleton from './wraps/SkeletonWrap';
import Logo from './logos/Logo';
import { useAccount, useBalance } from 'wagmi';
import { cleanValue } from '../utils/appUtils';

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
  const { data: baseBalance, isLoading: baseBalLoading } = useBalance({
    addressOrName: account,
    token: selectedBase?.address,
    enabled: !!selectedBase && !!account,
    staleTime: Infinity,
  });
  const { data: ilkBalance, isLoading: ilkBalLoading } = useBalance({
    addressOrName: account,
    token: selectedIlk?.address,
    enabled: !!selectedBase && !!account,
    staleTime: Infinity,
  });

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
              balance={cleanValue(baseBalance?.formatted!, 2)}
              loading={baseBalLoading}
            />
          )}
          {path === 'borrow' && selectedIlk?.proxyId !== WETH && selectedBase?.id !== selectedIlk?.id && (
            <Balance
              image={selectedIlk?.image}
              balance={cleanValue(ilkBalance?.formatted!, 2)}
              loading={ilkBalLoading}
            />
          )}
        </Box>
      )}
    </>
  );
};

export default YieldBalances;

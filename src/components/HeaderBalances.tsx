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
    userState: { selectedBase, selectedIlk, assetMap },
  } = useContext(UserContext);
  const baseBal = assetMap.get(selectedBase?.id!)?.balance_;
  const ilkBal = assetMap.get(selectedIlk?.id!)?.balance_;

  const { address: account } = useAccount();
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
          {selectedBase && selectedBase?.proxyId !== WETH && (
            <Balance image={selectedBase?.image} balance={cleanValue(baseBal, 2)} loading={false} />
          )}
          {selectedIlk &&
            path === 'borrow' &&
            selectedIlk?.proxyId !== WETH &&
            selectedBase?.id !== selectedIlk?.id && (
              <Balance image={selectedIlk?.image} balance={cleanValue(ilkBal, 2)} loading={false} />
            )}
        </Box>
      )}
    </>
  );
};

export default YieldBalances;

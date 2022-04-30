import { Box } from 'grommet';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import Logo from './Logo';
import USDCMark from './USDCMark';
import YFIMark from './YFIMark';

const Outer = styled(Box)`
  position: relative;
  max-width: fit-content;
`;

const Inner = styled(Box)`
  position: absolute;
  z-index: 10;
  top: -5px;
  left: -8px;
`;

const YVUSDCMark = () => {
  const { pathname } = useRouter();
  const isDash = pathname.includes('dashboard');
  const bottomStackSize = isDash ? '16px' : '24px';
  const topStackSize = isDash ? '12px' : '16px';

  return (
    <Outer>
      <Logo image={<USDCMark />} height={bottomStackSize} width={bottomStackSize} />
      <Inner>
        <Logo image={<YFIMark />} height={topStackSize} width={topStackSize} />
      </Inner>
    </Outer>
  );
};

export default YVUSDCMark;

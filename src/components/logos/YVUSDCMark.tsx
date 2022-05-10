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
  top: 12px;
  left: 12px;
`;

const YVUSDCMark = () => {
  const { pathname } = useRouter();
  const isDash = pathname.includes('dashboard');
  const bottomStackSize = isDash ? '20px' : '24px';
  const topStackSize = isDash ? '14px' : '14px';

  return (
    <Outer>
      <Logo image={<YFIMark />} height={bottomStackSize} width={bottomStackSize} />
      <Inner>
        <Logo image={<USDCMark />} height={topStackSize} width={topStackSize} />
      </Inner>
    </Outer>
  );
};

export default YVUSDCMark;

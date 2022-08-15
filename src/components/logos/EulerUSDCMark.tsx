import { Box } from 'grommet';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import EulerMark from './EulerMark';
import Logo from './Logo';
import USDCMark from './USDCMark';

const Outer = styled(Box)`
  position: relative;
  max-width: fit-content;
`;

const Inner = styled(Box)`
  position: absolute;
  z-index: 10;
  top: 10px;
  left: 10px;
`;

const EulerUSDCMark = () => {
  const { pathname } = useRouter();
  const isDash = pathname.includes('dashboard');
  const bottomStackSize = isDash ? '16px' : '24px';
  const topStackSize = isDash ? '12px' : '14px';

  return (
    <Outer>
      <Logo image={<USDCMark />} height={bottomStackSize} width={bottomStackSize} />
      <Inner>
        <Outer>
          <Logo image={<EulerMark />} height={topStackSize} width={topStackSize} />
        </Outer>
      </Inner>
    </Outer>
  );
};

export default EulerUSDCMark;
